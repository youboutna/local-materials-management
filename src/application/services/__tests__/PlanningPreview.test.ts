import {describe,expect,it} from 'vitest';
import {ProjectImportTemplateService} from '../ProjectImportTemplateService';
import {DEFAULT_PLANNING_MAPPING} from '@/config/referentials/projects/planning-import.referential';
const service=new ProjectImportTemplateService();
describe('Generic planning table preview',()=>{
  it('preserves overlap, an independently dated deliverable and postdelivery period',()=>{
    const preview=service.previewPlanning({text:'Audit\tInventory\tSemaines 1-4\tDelivery (S4)\nModel\tData\tSemaines 3-7\tDelivery (S8)\nSupport\tHotline\tJ+1 à J+60 post-livraison\tReport',title:'A',reference:'REF',startDate:'2026-01-01',currency:'MRU',referentialCode:'CUSTOM_STANDARD',mapping:DEFAULT_PLANNING_MAPPING});
    expect(preview.project.phases?.[1].startDate).toBe('2026-01-15');
    expect(preview.project.phases?.[1].milestones?.[0].targetDate).toBe('2026-02-25');
    expect(preview.project.phases?.[2].startDate).toBe('2026-02-19');
    expect(preview.project.phases?.[2].endDate).toBe('2026-04-19');
  });
  it('accepts different schedule vocabulary through mapping rather than business-specific code',()=>{
    const preview=service.previewPlanning({text:'Stage\tWork\tPeriods 2-3\tGate P3',title:'B',reference:'B',startDate:'2026-01-01',currency:'EUR',referentialCode:'CUSTOM_STANDARD',mapping:{...DEFAULT_PLANNING_MAPPING,weekPattern:'Periods (\\d+)-(\\d+)',milestonePattern:'P(\\d+)',daysPerWeek:5}});
    expect(preview.project.phases?.[0].startDate).toBe('2026-01-06');expect(preview.project.phases?.[0].endDate).toBe('2026-01-15');
  });
  it('reports all unmapped prose without losing the original source',()=>{
    const text='Quality requirement\nStage\tWork\tSemaine 1\tDelivery';
    const preview=service.previewPlanning({text,title:'A',reference:'A',startDate:'2026-01-01',currency:'MRU',referentialCode:'CUSTOM_STANDARD',mapping:DEFAULT_PLANNING_MAPPING});
    expect(preview.unmatchedLines).toEqual([{line:1,text:'Quality requirement'}]);expect(preview.project.description).toBe(text);
  });
});