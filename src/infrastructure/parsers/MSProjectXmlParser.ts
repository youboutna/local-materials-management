// src/infrastructure/parsers/MSProjectXmlParser.ts
//
// Parseur MS Project XML → ProjectImportRow[]
//
// Mapping hiérarchique :
//   OutlineLevel 0 → métadonnées projet
//   OutlineLevel 1 → Phase
//   OutlineLevel 2 → Step (imbriqué dans la phase)
//   OutlineLevel 3+ → Task (imbriquée dans le step)

import type {
  ProjectImportRow,
  ProjectImportPhase,
  ProjectImportTask,
} from '@/application/services/ProjectImportExportService';
import {
  IProjectFileParser,
  ProjectFileParserOptions,
  readFileAsText,
} from './IProjectFileParser';

interface MSProjectTask {
  uid: number;
  id: number;
  name: string;
  outlineLevel: number;
  summary: 0 | 1;
  start?: string;
  finish?: string;
  durationHours?: number;
  percentComplete?: number;
  notes?: string;
  resourceNames?: string;
  cost?: number;
  wbs?: string;
}

interface StepEntry {
  code: string;
  name: string;
  order: number;
  tasks: ProjectImportTask[];
}

export class MSProjectXmlParser implements IProjectFileParser {
  readonly name = 'MSProjectXmlParser';
  readonly supportedExtensions = ['xml'];

  async parse(file: File, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const content = await readFileAsText(file);
    return this.parseContent(content, options);
  }

  async parseContent(content: string, options: ProjectFileParserOptions = {}): Promise<ProjectImportRow[]> {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'application/xml');

    if (doc.querySelector('parsererror')) {
      throw new Error('XML invalide : impossible de lire le fichier.');
    }

    if (!doc.querySelector('Project > Tasks')) {
      throw new Error(
        "Ce fichier XML n'est pas un MS Project XML (balise <Project><Tasks> manquante).",
      );
    }

    const tasks = this.extractTasks(doc);
    if (tasks.length === 0) {
      throw new Error('MS Project XML vide : aucune tâche trouvée.');
    }

    return [this.buildProject(tasks, options)];
  }

  private extractTasks(doc: Document): MSProjectTask[] {
    return Array.from(doc.querySelectorAll('Project > Tasks > Task'))
      .map((node) => this.parseTaskNode(node))
      .filter((t): t is MSProjectTask => t !== null)
      .sort((a, b) => a.id - b.id);
  }

  private parseTaskNode(node: Element): MSProjectTask | null {
    const name = node.querySelector('Name')?.textContent?.trim();
    if (!name) return null;

    return {
      uid: Number(node.querySelector('UID')?.textContent ?? 0),
      id: Number(node.querySelector('ID')?.textContent ?? 0),
      name,
      outlineLevel: Number(node.querySelector('OutlineLevel')?.textContent ?? 0),
      summary: Number(node.querySelector('Summary')?.textContent ?? 0) === 1 ? 1 : 0,
      start: node.querySelector('Start')?.textContent ?? undefined,
      finish: node.querySelector('Finish')?.textContent ?? undefined,
      durationHours: this.parseIsoDuration(node.querySelector('Duration')?.textContent ?? undefined),
      percentComplete: node.querySelector('PercentComplete')?.textContent
        ? Number(node.querySelector('PercentComplete')!.textContent)
        : undefined,
      notes: node.querySelector('Notes')?.textContent ?? undefined,
      resourceNames: node.querySelector('ResourceNames')?.textContent ?? undefined,
      cost: node.querySelector('Cost')?.textContent
        ? Number(node.querySelector('Cost')!.textContent)
        : undefined,
      wbs: node.querySelector('WBS')?.textContent ?? undefined,
    };
  }

  private parseIsoDuration(iso?: string): number | undefined {
    if (!iso) return undefined;
    const match = /PT(?:(\d+)H)?(?:(\d+)M)?/.exec(iso);
    if (!match) return undefined;
    const h = Number(match[1] ?? 0);
    const m = Number(match[2] ?? 0);
    return h + m / 60;
  }

  private buildProject(
    tasks: MSProjectTask[],
    options: ProjectFileParserOptions,
  ): ProjectImportRow {
    const root = tasks.find((t) => t.outlineLevel === 0);
    const title = root?.name ?? options.fallbackTitle ?? 'Projet importé depuis MS Project';

    const phases = this.buildPhases(tasks);

    const leafTasks = tasks.filter((t) => t.summary === 0);
    const startDate = this.earliestDate(leafTasks.map((t) => t.start));
    const endDate = this.latestDate(leafTasks.map((t) => t.finish));

    return {
      externalRef: `MSPROJECT-${Date.now()}`,
      title,
      description: root?.notes ?? `Importé depuis MS Project (${tasks.length} tâches)`,
      location: options.fallbackLocation ?? 'À préciser',
      status: 'en attente',
      progress: root?.percentComplete ?? 0,
      budget: root?.cost ?? 0,
      currency: 'MRU',
      startDate,
      endDate,
      teamSize: 1,
      referentialCode: options.referentialCode,
      phases,
    };
  }

  private buildPhases(tasks: MSProjectTask[]): ProjectImportPhase[] {
    const level1 = tasks.filter((t) => t.outlineLevel === 1);

    if (level1.length === 0) {
      const leaves = tasks.filter((t) => t.outlineLevel > 0 && t.summary === 0);
      if (leaves.length === 0) return [];
      return [{
        code: 'IMPORTED',
        name: 'Importé depuis MS Project',
        order: 1,
        startDate: this.earliestDate(leaves.map((t) => t.start)),
        endDate: this.latestDate(leaves.map((t) => t.finish)),
        durationDays: this.sumHours(leaves.map((t) => t.durationHours)) / 8 || undefined,
        tasks: leaves.map((t) => this.taskToImportTask(t)),
      }];
    }

    return level1.map((phaseTask) => this.buildPhase(tasks, phaseTask));
  }

  private buildPhase(tasks: MSProjectTask[], phaseTask: MSProjectTask): ProjectImportPhase {
    const children = this.directChildren(tasks, phaseTask);
    const steps: StepEntry[] = [];
    const directTasks: ProjectImportTask[] = [];

    for (const child of children) {
      if (child.summary === 0) {
        directTasks.push(this.taskToImportTask(child));
      } else {
        const leafTasks = this.leafDescendants(tasks, child);
        steps.push({
          code: this.slugify(child.name),
          name: child.name,
          order: child.id,
          tasks: leafTasks.map((t) => this.taskToImportTask(t)),
        });
      }
    }

    if (children.length === 0 && phaseTask.summary === 0) {
      directTasks.push(this.taskToImportTask(phaseTask));
    }

    const phase: ProjectImportPhase = {
      code: this.slugify(phaseTask.name),
      name: phaseTask.name,
      description: phaseTask.notes,
      order: phaseTask.id,
      startDate: this.isoDate(phaseTask.start),
      endDate: this.isoDate(phaseTask.finish),
      durationDays: phaseTask.durationHours
        ? Math.max(1, Math.round(phaseTask.durationHours / 8))
        : undefined,
      status: this.mapStatus(phaseTask.percentComplete),
      tasks: directTasks,
    };

    if (steps.length > 0) {
      (phase as unknown as { steps: StepEntry[] }).steps = steps;
    }

    return phase;
  }

  private directChildren(tasks: MSProjectTask[], parent: MSProjectTask): MSProjectTask[] {
    const result: MSProjectTask[] = [];
    let inside = false;
    for (const t of tasks) {
      if (t.uid === parent.uid) { inside = true; continue; }
      if (!inside) continue;
      if (t.outlineLevel <= parent.outlineLevel) break;
      if (t.outlineLevel === parent.outlineLevel + 1) result.push(t);
    }
    return result;
  }

  private leafDescendants(tasks: MSProjectTask[], parent: MSProjectTask): MSProjectTask[] {
    const result: MSProjectTask[] = [];
    let inside = false;
    for (const t of tasks) {
      if (t.uid === parent.uid) { inside = true; continue; }
      if (!inside) continue;
      if (t.outlineLevel <= parent.outlineLevel) break;
      if (t.summary === 0) result.push(t);
    }
    return result;
  }

  private taskToImportTask(task: MSProjectTask): ProjectImportTask {
    return {
      title: task.name,
      description: task.notes,
      status: this.mapStatus(task.percentComplete),
      progress: task.percentComplete ?? 0,
      startDate: this.isoDate(task.start),
      endDate: this.isoDate(task.finish),
      estimatedHours: task.durationHours,
      estimatedDurationDays: task.durationHours
        ? Math.max(1, Math.round(task.durationHours / 8))
        : undefined,
      assigneeName: task.resourceNames,
    };
  }

  private mapStatus(percent?: number): string {
    if (percent == null) return 'pending';
    if (percent >= 100) return 'completed';
    if (percent > 0) return 'in_progress';
    return 'pending';
  }

  private isoDate(iso?: string): string | undefined {
    if (!iso) return undefined;
    try {
      return new Date(iso).toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  private earliestDate(dates: Array<string | undefined>): string | undefined {
    const valid = dates.filter((d): d is string => !!d).sort();
    return valid[0] ? this.isoDate(valid[0]) : undefined;
  }

  private latestDate(dates: Array<string | undefined>): string | undefined {
    const valid = dates.filter((d): d is string => !!d).sort().reverse();
    return valid[0] ? this.isoDate(valid[0]) : undefined;
  }

  private sumHours(hours: Array<number | undefined>): number {
    return hours.reduce((sum, h) => sum + (h ?? 0), 0);
  }

  private slugify(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 40);
  }
}