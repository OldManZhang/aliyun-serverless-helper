// tests/unit/handlers/invokeHandler.test.js
const inquirer = require('inquirer');
const { handleInvoke } = require('../../../src/handlers/invokeHandler');
const { readResourceConfig } = require('../../../src/config');
const { selectResource } = require('../../../src/utils'); // Import selectResource directly

// Mock dependencies
jest.mock('inquirer');
jest.mock('../../../src/config');
jest.mock('../../../src/utils');

describe('handlers/invokeHandler.js', () => {
  const mockResourcesList = ['resourceA', 'resourceB'];
  const mockYamlPath = './s.yaml';
  const mockOptions = {};

  beforeEach(() => {
    readResourceConfig.mockReturnValue(mockResourcesList);
    // Mock executeCommand
    require('../../../src/utils').executeCommand.mockResolvedValue(true);
    // Mock selectResource to return a predefined value
    selectResource.mockResolvedValue('resourceB');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should invoke a resource when resourceName is provided and user confirms', async () => {
    const resourceName = 'resourceA';
    inquirer.prompt.mockResolvedValue({ proceed: true }); // User confirms

    await handleInvoke(resourceName, mockOptions);

    expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'confirm',
        message: expect.stringContaining(`s  ${resourceName} invoke`)
      })
    ]));
    expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(`s  ${resourceName} invoke`, mockOptions);
  });

  it('should prompt for resource selection when resourceName is not provided and user confirms', async () => {
    const selectedResource = 'resourceB';
    // Mock selectResource to return the selected resource
    selectResource.mockResolvedValueOnce(selectedResource);
    // Mock inquirer.prompt for confirmation
    inquirer.prompt.mockResolvedValueOnce({ proceed: true });  // Confirmation

    await handleInvoke(null, mockOptions);

    expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
    expect(selectResource).toHaveBeenCalledWith(mockResourcesList, 'Select a resource to invoke:');
    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'confirm',
        message: expect.stringContaining(`s  ${selectedResource} invoke`)
      })
    ]));
    expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(`s  ${selectedResource} invoke`, mockOptions);
  });

  it('should exit if provided resourceName is not found', async () => {
    const invalidResourceName = 'invalidResource';
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    await handleInvoke(invalidResourceName, mockOptions);

    expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: Resource "${invalidResourceName}" not found in ${mockYamlPath}`);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should use custom template path', async () => {
    const customPath = './custom-s.yaml';
    const resourceName = 'resourceA';
    const optionsWithTemplate = { template: customPath };
    readResourceConfig.mockReturnValue(mockResourcesList); // Update mock for custom path
    inquirer.prompt.mockResolvedValue({ proceed: true }); // User confirms

    await handleInvoke(resourceName, optionsWithTemplate);

    expect(readResourceConfig).toHaveBeenCalledWith(customPath, optionsWithTemplate);
    expect(inquirer.prompt).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({
        type: 'confirm',
        message: expect.stringContaining(`s -t ${customPath} ${resourceName} invoke`)
      })
    ]));
    expect(require('../../../src/utils').executeCommand).toHaveBeenCalledWith(`s -t ${customPath} ${resourceName} invoke`, optionsWithTemplate);
  });
  
  it('should log command cancelled if user does not confirm', async () => {
    const resourceName = 'resourceA';
    inquirer.prompt.mockResolvedValue({ proceed: false }); // User cancels
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();

    await handleInvoke(resourceName, mockOptions);

    expect(readResourceConfig).toHaveBeenCalledWith(mockYamlPath, mockOptions);
    expect(inquirer.prompt).toHaveBeenCalled();
    expect(require('../../../src/utils').executeCommand).not.toHaveBeenCalled();
    expect(consoleLogSpy).toHaveBeenCalledWith('Command cancelled.');

    consoleLogSpy.mockRestore();
  });
});