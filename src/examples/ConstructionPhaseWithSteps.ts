/**
 * Example: Using ConstructionPhaseService with Referential Steps
 * This example demonstrates how to create phases with steps from the referential
 */

import { ConstructionPhaseService } from '@/application/services/ConstructionPhaseService';
import { RepositoryFactory } from '@/infrastructure/supabase/RepositoryFactory';

export class ConstructionPhaseWithStepsExample {
  private phaseService: ConstructionPhaseService;

  constructor() {
    this.phaseService = new ConstructionPhaseService(
      RepositoryFactory.getConstructionPhaseRepository()
    );
  }

  /**
   * Example 1: Create phases from CUSTOM_STANDARD referential
   */
  async createPhasesFromCustomStandard(projectId: string) {
    try {
      console.log('Creating phases from CUSTOM_STANDARD referential...');
      
      // This will create phases with steps from the referential
      const phases = await this.phaseService.createPhasesFromReferential(
        projectId, 
        'CUSTOM_STANDARD' // Referential code
      );

      console.log(`Created ${phases.length} phases with steps:`);
      
      phases.forEach((phase, index) => {
        console.log(`\nPhase ${index + 1}: ${phase.name}`);
        console.log(`- Type: ${phase.type}`);
        console.log(`- Stage: ${phase.stage}`);
        console.log(`- Steps count: ${phase.steps?.length || 0}`);
        
        // Display steps with tasks
        phase.steps?.forEach((step, stepIndex) => {
          console.log(`  Step ${stepIndex + 1}: ${step.name}`);
          console.log(`    - Progress: ${step.progress}%`);
          console.log(`    - Tasks: ${step.tasks.length}`);
          
          step.tasks.forEach((task, taskIndex) => {
            console.log(`      Task ${taskIndex + 1}: ${task.name}`);
            console.log(`        - Duration: ${task.estimated_duration_days} days`);
            console.log(`        - Status: ${task.status}`);
          });
        });
      });

      return phases;
    } catch (error) {
      console.error('Failed to create phases from referential:', error);
      throw error;
    }
  }

  /**
   * Example 2: Update step progress
   */
  async updateStepProgress(phaseId: string) {
    try {
      console.log('Updating step progress...');
      
      // Update progress for specific steps
      const stepUpdates = [
        { stepId: 'step-123-0', progress: 50, status: 'in_progress' },
        { stepId: 'step-123-1', progress: 100, status: 'completed' },
        { stepId: 'step-123-2', progress: 25, status: 'in_progress' }
      ];

      const updatedPhase = await this.phaseService.updatePhaseStepsProgress(
        phaseId, 
        stepUpdates
      );

      console.log('Phase updated successfully:');
      console.log(`- Overall progress: ${updatedPhase.progress}%`);
      console.log(`- Status: ${updatedPhase.status}`);
      
      updatedPhase.steps?.forEach((step, index) => {
        console.log(`Step ${index + 1}: ${step.name} - ${step.progress}%`);
      });

      return updatedPhase;
    } catch (error) {
      console.error('Failed to update step progress:', error);
      throw error;
    }
  }

  /**
   * Example 3: Get phase with steps as DTO
   */
  async getPhaseWithSteps(phaseId: string) {
    try {
      // Get phase from repository
      const phase = await this.phaseService.getPhaseById(phaseId);
      
      if (!phase) {
        throw new Error('Phase not found');
      }

      // Convert to DTO (includes steps)
      const phaseDTO = this.phaseService.toDTO(phase);

      console.log('Phase DTO with steps:');
      console.log(`- Phase: ${phaseDTO.phase_name}`);
      console.log(`- Steps: ${phaseDTO.steps.length}`);
      
      phaseDTO.steps.forEach((step, index) => {
        console.log(`  Step ${index + 1}: ${step.name}`);
        console.log(`    - Duration: ${step.estimated_duration_days} days`);
        console.log(`    - Tasks: ${step.tasks.length}`);
      });

      return phaseDTO;
    } catch (error) {
      console.error('Failed to get phase with steps:', error);
      throw error;
    }
  }

  /**
   * Example 4: Complete workflow demonstration
   */
  async demonstrateCompleteWorkflow(projectId: string) {
    try {
      console.log('=== Complete Construction Phase Workflow Demo ===\n');

      // Step 1: Create phases from referential
      console.log('1. Creating phases from referential...');
      const phases = await this.createPhasesFromCustomStandard(projectId);
      
      // Step 2: Work with first phase
      const firstPhase = phases[0];
      console.log(`\n2. Working with phase: ${firstPhase.name}`);
      
      // Step 3: Update step progress
      if (firstPhase.steps && firstPhase.steps.length > 0) {
        console.log('\n3. Updating step progress...');
        const stepUpdates = firstPhase.steps.slice(0, 2).map((step, index) => ({
          stepId: step.id,
          progress: index === 0 ? 100 : 50,
          status: index === 0 ? 'completed' : 'in_progress'
        }));
        
        await this.phaseService.updatePhaseStepsProgress(firstPhase.id, stepUpdates);
      }

      // Step 4: Get updated phase as DTO
      console.log('\n4. Getting updated phase as DTO...');
      await this.getPhaseWithSteps(firstPhase.id);

      console.log('\n=== Workflow Demo Complete ===');
    } catch (error) {
      console.error('Workflow demo failed:', error);
      throw error;
    }
  }
}

// Usage example:
/*
const example = new ConstructionPhaseWithStepsExample();

// Create phases for a new project
example.createPhasesFromCustomStandard('project-123')
  .then(phases => console.log('Phases created successfully'))
  .catch(error => console.error('Failed to create phases:', error));

// Update step progress
example.updateStepProgress('phase-456')
  .then(phase => console.log('Step progress updated'))
  .catch(error => console.error('Failed to update progress:', error));

// Run complete workflow
example.demonstrateCompleteWorkflow('project-789')
  .then(() => console.log('Workflow completed'))
  .catch(error => console.error('Workflow failed:', error));
*/

export default ConstructionPhaseWithStepsExample;
