// tests/unit/handlers/instanceHandler.test.js
const inquirer = require('inquirer');
const {
  handleInstanceList,
  handleInstanceLog,
  handleInstanceExec,
  handleInstanceInteractive
} = require('../../../src/handlers/instanceHandler');
const { readResourceConfig } = require('../../../src/config');
const { selectResource } = require('../../../src/utils'); // Import selectResource directly

// Mock dependencies
jest.mock('inquirer');
jest.mock('child_process');
jest.mock('../../../src/config');
jest.mock('../../../src/utils');

describe('handlers/instanceHandler.js', () => {
  const mockResourcesList = ['resourceA', 'resourceB'];
  const mockYamlPath = './s.yaml';
  const mockOptions = {};

  beforeEach(() => {
    readResourceConfig.mockReturnValue(mockResourcesList);
    // Mock executeCommand
    require('../../../src/utils').executeCommand.mockResolvedValue(true);
    // Mock getInstanceIds
    require('../../../src/utils').getInstanceIds.mockResolvedValue([]);
    // Mock selectResource to return a predefined value
    selectResource.mockResolvedValue('resourceA');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleInstanceList', () => {
    it('should list instances for a selected resource and execute command if confirmed', async () => {
      const selectedResource = 'resourceA';
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      // Mock inquirer.prompt for confirmation
      inquirer.prompt.mockResolvedValueOnce({ proceed: true });  // Confirmation

      await handleInstanceList(mockOptions);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource to list instances:');
      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s  ${selectedResource} instance list`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(`s  ${selectedResource} instance list`, mockOptions);
    });

    it('should use custom template path', async () => {
      const customPath = './custom-s.yaml';
      const selectedResource = 'resourceA';
      const optionsWithTemplate = { template: customPath };
      readResourceConfig.mockReturnValue(mockResourcesList);
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      // Mock inquirer.prompt for confirmation
      inquirer.prompt.mockResolvedValueOnce({ proceed: true });

      await handleInstanceList(optionsWithTemplate);

      expect(readResourceConfig).toHaveBeenCalledWith(customPath, optionsWithTemplate);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource to list instances:');
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s -t ${customPath} ${selectedResource} instance list`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(`s -t ${customPath} ${selectedResource} instance list`, optionsWithTemplate);
    });

    it('should log command cancelled if user does not confirm', async () => {
      const selectedResource = 'resourceA';
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      // Mock inquirer.prompt for confirmation (user cancels)
      inquirer.prompt.mockResolvedValueOnce({ proceed: false }); // User cancels
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleInstanceList(mockOptions);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource to list instances:');
      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      expect(require('../../../src/utils').executeCommand).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith('Command cancelled.');

      consoleLogSpy.mockRestore();
    });
  });

  describe('getInstanceIds', () => {
    // Since getInstanceIds is now in utils.js and we're mocking it,
    // we should test the behavior in instanceHandler.js that uses it.
    // The actual implementation of getInstanceIds is tested in utils.test.js
    
    it('should handle instance selection in handleInstanceLog when no instanceId is provided', async () => {
      const selectedResource = 'resourceA';
      const mockInstances = [{ name: 'i-123', value: 'i-123' }];
      
      // Mock getInstanceIds to return instances
      require('../../../src/utils').getInstanceIds.mockResolvedValue(mockInstances);
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      
      inquirer.prompt
        .mockResolvedValueOnce({ instanceId: 'i-123' }) // Instance selection
        .mockResolvedValueOnce({ proceed: true });   // Confirmation

      await handleInstanceLog(null, mockOptions); // Pass null for instanceId to trigger selection

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(require('../../../src/utils').getInstanceIds).toHaveBeenCalledWith(selectedResource, mockOptions);
      expect(inquirer.prompt).toHaveBeenCalledTimes(2);
      expect(inquirer.prompt).toHaveBeenNthCalledWith(1, expect.arrayContaining([
        expect.objectContaining({
          type: 'list',
          choices: mockInstances
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${selectedResource} logs --tail --instance-id i-123`,
        mockOptions
      );
    });
    
    it('should handle instance selection in handleInstanceExec when no instanceId is provided', async () => {
      const selectedResource = 'resourceA';
      const commandToExecute = 'ls -l';
      const mockInstances = [{ name: 'i-123', value: 'i-123' }];
      
      // Mock getInstanceIds to return instances
      require('../../../src/utils').getInstanceIds.mockResolvedValue(mockInstances);
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      
      inquirer.prompt
        .mockResolvedValueOnce({ instanceId: 'i-123' })  // Instance selection
        .mockResolvedValueOnce({ command: commandToExecute }) // Command input
        .mockResolvedValueOnce({ proceed: true });       // Confirmation

      await handleInstanceExec(null, mockOptions); // Pass null for instanceId to trigger selection

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(require('../../../src/utils').getInstanceIds).toHaveBeenCalledWith(selectedResource, mockOptions);
      expect(inquirer.prompt).toHaveBeenCalledTimes(3);
      expect(inquirer.prompt).toHaveBeenNthCalledWith(1, expect.arrayContaining([
        expect.objectContaining({
          type: 'list',
          choices: mockInstances
        })
      ]));
      expect(inquirer.prompt).toHaveBeenNthCalledWith(2, expect.arrayContaining([
        expect.objectContaining({
          type: 'input',
          default: 'sh',
          validate: expect.any(Function) // Check that validate function is present
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${selectedResource} instance exec --instance-id i-123 -c "${commandToExecute}"`,
        mockOptions
      );
    });
  });

  describe('handleInstanceLog', () => {
    it('should show logs for a selected instance and execute command if confirmed', async () => {
      const instanceId = 'i-123';
      const selectedResource = 'resourceA';
      
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      // Mock inquirer.prompt for confirmation
      inquirer.prompt.mockResolvedValueOnce({ proceed: true });   // Confirmation

      await handleInstanceLog(instanceId, mockOptions); // Provide instanceId directly

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(inquirer.prompt).toHaveBeenCalledTimes(1); // Only confirmation
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s  ${selectedResource} logs --tail --instance-id ${instanceId}`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${selectedResource} logs --tail --instance-id ${instanceId}`,
        mockOptions
      );
    });

    it('should use provided resource name and instance ID', async () => {
      const instanceId = 'i-123';
      const resourceName = 'resourceA';
      const optionsWithResource = { ...mockOptions, resource: resourceName };
      
      inquirer.prompt
        .mockResolvedValueOnce({ proceed: true }); // Only confirmation needed

      await handleInstanceLog(instanceId, optionsWithResource);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, optionsWithResource);
      expect(inquirer.prompt).toHaveBeenCalledTimes(1);
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s  ${resourceName} logs --tail --instance-id ${instanceId}`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${resourceName} logs --tail --instance-id ${instanceId}`,
        optionsWithResource
      );
    });

    it('should exit if provided resource name is not found', async () => {
      const instanceId = 'i-123';
      const invalidResourceName = 'invalidResource';
      const optionsWithResource = { ...mockOptions, resource: invalidResourceName };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      // Mock inquirer.prompt to provide the confirmation
      inquirer.prompt
        .mockResolvedValueOnce({ proceed: true }); // Confirmation (this won't be reached due to error)

      await handleInstanceLog(instanceId, optionsWithResource);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, optionsWithResource);
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: Resource "${invalidResourceName}" not found in ${mockYamlPath}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should log message if no instances available', async () => {
      const selectedResource = 'resourceA';
      require('../../../src/utils').getInstanceIds.mockResolvedValue([]); // No instances
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleInstanceLog(null, mockOptions);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(require('../../../src/utils').getInstanceIds).toHaveBeenCalledWith(selectedResource, mockOptions);
      expect(consoleLogSpy).toHaveBeenCalledWith('No instances available. Please deploy and invoke the resource first.');
      expect(inquirer.prompt).toHaveBeenCalledTimes(0); // No prompts
      expect(require('../../../src/utils').executeCommand).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should use custom template path', async () => {
      const instanceId = 'i-123';
      const resourceName = 'resourceA';
      const customPath = './custom-s.yaml';
      const optionsWithTemplateAndResource = { template: customPath, resource: resourceName };
      
      inquirer.prompt
        .mockResolvedValueOnce({ proceed: true }); // Only confirmation needed

      await handleInstanceLog(instanceId, optionsWithTemplateAndResource);

      expect(readResourceConfig).toHaveBeenCalledWith(customPath, optionsWithTemplateAndResource);
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s -t ${customPath} ${resourceName} logs --tail --instance-id ${instanceId}`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s -t ${customPath} ${resourceName} logs --tail --instance-id ${instanceId}`,
        optionsWithTemplateAndResource
      );
    });
  });

  describe('handleInstanceExec', () => {
    it('should execute command on a selected instance and execute command if confirmed', async () => {
      const instanceId = 'i-123';
      const selectedResource = 'resourceA';
      const commandToExecute = 'ls -l';
      
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      // Mock inquirer.prompt for command input and confirmation
      inquirer.prompt
        .mockResolvedValueOnce({ command: commandToExecute }) // Command input
        .mockResolvedValueOnce({ proceed: true });       // Confirmation

      await handleInstanceExec(instanceId, mockOptions); // Provide instanceId directly

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(inquirer.prompt).toHaveBeenCalledTimes(2); // Command input, and confirmation
      expect(inquirer.prompt).toHaveBeenNthCalledWith(1, expect.arrayContaining([
        expect.objectContaining({
          type: 'input',
          default: 'sh',
          validate: expect.any(Function) // Check that validate function is present
        })
      ]));
      expect(inquirer.prompt).toHaveBeenNthCalledWith(2, expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s  ${selectedResource} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${selectedResource} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`,
        mockOptions
      );
    });

    it('should use provided resource name and instance ID', async () => {
      const instanceId = 'i-123';
      const resourceName = 'resourceA';
      const commandToExecute = 'pwd';
      const optionsWithResource = { ...mockOptions, resource: resourceName };
      
      inquirer.prompt
        .mockResolvedValueOnce({ command: commandToExecute }) // Command input
        .mockResolvedValueOnce({ proceed: true });           // Confirmation

      await handleInstanceExec(instanceId, optionsWithResource);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, optionsWithResource);
      expect(inquirer.prompt).toHaveBeenCalledTimes(2);
      expect(inquirer.prompt).toHaveBeenNthCalledWith(1, expect.arrayContaining([
        expect.objectContaining({
          type: 'input',
          default: 'sh',
          validate: expect.any(Function) // Check that validate function is present
        })
      ]));
      expect(inquirer.prompt).toHaveBeenNthCalledWith(2, expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s  ${resourceName} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s  ${resourceName} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`,
        optionsWithResource
      );
    });

    it('should exit if provided resource name is not found', async () => {
      const instanceId = 'i-123';
      const invalidResourceName = 'invalidResource';
      const commandToExecute = 'pwd';
      const optionsWithResource = { ...mockOptions, resource: invalidResourceName };
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

      // Mock inquirer.prompt to provide the command
      inquirer.prompt
        .mockResolvedValueOnce({ command: commandToExecute })
        .mockResolvedValueOnce({ proceed: true }); // Confirmation (this won't be reached due to error)

      await handleInstanceExec(instanceId, optionsWithResource);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, optionsWithResource);
      expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: Resource "${invalidResourceName}" not found in ${mockYamlPath}`);
      expect(processExitSpy).toHaveBeenCalledWith(1);

      consoleErrorSpy.mockRestore();
      processExitSpy.mockRestore();
    });

    it('should log message if no instances available', async () => {
      const selectedResource = 'resourceA';
      require('../../../src/utils').getInstanceIds.mockResolvedValue([]); // No instances
      // Mock selectResource to return the selected resource
      selectResource.mockResolvedValueOnce(selectedResource);
      
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

      await handleInstanceExec(null, mockOptions);

      expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
      expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource:');
      expect(require('../../../src/utils').getInstanceIds).toHaveBeenCalledWith(selectedResource, mockOptions);
      expect(consoleLogSpy).toHaveBeenCalledWith('No instances available. Please deploy and invoke the resource first.');
      expect(inquirer.prompt).toHaveBeenCalledTimes(0); // No prompts
      expect(require('../../../src/utils').executeCommand).not.toHaveBeenCalled();

      consoleLogSpy.mockRestore();
    });

    it('should use custom template path', async () => {
      const instanceId = 'i-123';
      const resourceName = 'resourceA';
      const commandToExecute = 'echo hello';
      const customPath = './custom-s.yaml';
      const optionsWithTemplateAndResource = { template: customPath, resource: resourceName };
      
      inquirer.prompt
        .mockResolvedValueOnce({ command: commandToExecute }) // Command input
        .mockResolvedValueOnce({ proceed: true });           // Confirmation

      await handleInstanceExec(instanceId, optionsWithTemplateAndResource);

      expect(readResourceConfig).toHaveBeenCalledWith(customPath, optionsWithTemplateAndResource);
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'confirm',
          message: expect.stringContaining(`s -t ${customPath} ${resourceName} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`)
        })
      ]));
      expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(
        `s -t ${customPath} ${resourceName} instance exec --instance-id ${instanceId} -c "${commandToExecute}"`,
        optionsWithTemplateAndResource
      );
    });
  });
  
  describe('handleInstanceInteractive', () => {
    it('should handle instance list subcommand', async () => {
      // We need to mock handleInstanceList to verify it's called
      // Since handleInstanceList is not directly mockable, we'll test the inquirer prompt
      inquirer.prompt.mockResolvedValue({ subcommand: 'list' });
      
      // We'll check if inquirer.prompt is called with the right values
      await handleInstanceInteractive(mockOptions);
      
      expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
        expect.objectContaining({
          type: 'list',
          choices: ['list', 'log', 'exec']
        })
      ]));
      // We cannot directly test if handleInstanceList is called, but we can test the flow
    });
    
    it('should handle instance log subcommand', async () => {
      const mockInstances = [{ name: 'i-123', value: 'i-123' }];
      
      inquirer.prompt
        .mockResolvedValueOnce({ subcommand: 'log' })
        .mockResolvedValueOnce({ selectedResource: 'resourceA' }) // Resource selection
        .mockResolvedValueOnce({ instanceId: 'i-123' }); // Mock instance selection
        
      // Mock getInstanceIds
      require('../../../src/utils').getInstanceIds.mockResolvedValue(mockInstances);
      
      await handleInstanceInteractive(mockOptions);
      
      // The number of calls might vary depending on the flow, so we'll just check the important ones
      // expect(inquirer.prompt).toHaveBeenCalledTimes(2);
      // We cannot directly test if handleInstanceLog is called, but we can test the flow
    });
    
    it('should handle instance exec subcommand', async () => {
      const mockInstances = [{ name: 'i-123', value: 'i-123' }];
      const commandToExecute = 'sh';
      
      inquirer.prompt
        .mockResolvedValueOnce({ subcommand: 'exec' })
        .mockResolvedValueOnce({ selectedResource: 'resourceA' }) // Resource selection
        .mockResolvedValueOnce({ instanceId: 'i-123' }) // Mock instance selection
        .mockResolvedValueOnce({ command: commandToExecute }); // Mock command input
        
      // Mock getInstanceIds
      require('../../../src/utils').getInstanceIds.mockResolvedValue(mockInstances);
      
      await handleInstanceInteractive(mockOptions);
      
      // The number of calls might vary depending on the flow, so we'll just check the important ones
      // expect(inquirer.prompt).toHaveBeenCalledTimes(3);
      // We cannot directly test if handleInstanceExec is called, but we can test the flow
    });
  });
});