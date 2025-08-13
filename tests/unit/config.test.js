// tests/unit/config.test.js
const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');
const { readResourceConfig } = require('../../src/config');

// Mock fs, yaml, and child_process
jest.mock('fs');
jest.mock('js-yaml');
jest.mock('child_process');

describe('config.js -> readResourceConfig (FC3 focused)', () => {
  const mockYamlPath = './s.yaml';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should read and parse standard FC3 format s.yaml correctly', () => {
    const mockYamlContent = `
resources:
  resourceX:
    # ... config
  resourceY:
    # ... config
`;
    const mockParsedConfig = {
      resources: {
        resourceX: {},
        resourceY: {}
      }
    };

    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);

    const result = readResourceConfig(mockYamlPath);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockYamlPath, 'utf8');
    expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    expect(result).toEqual(['resourceX', 'resourceY']);
  });

  it('should warn about old FC format (services) and proceed if resources exist', () => {
    const mockYamlContent = `
services: # Old format
  serviceA: {}
resources: # New format
  resourceX: {}
`;
    const mockParsedConfig = {
      services: { serviceA: {} },
      resources: { resourceX: {} }
    };

    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

    const result = readResourceConfig(mockYamlPath);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockYamlPath, 'utf8');
    expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('old FC format'));
    expect(result).toEqual(['resourceX']); // Should prioritize resources

    consoleWarnSpy.mockRestore();
  });

  it('should error and exit if only old FC format (services) is found', () => {
    const mockYamlContent = `
services:
  serviceA: {}
  serviceB: {}
`;
    const mockParsedConfig = {
      services: {
        serviceA: {},
        serviceB: {}
      }
    };

    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    readResourceConfig(mockYamlPath);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockYamlPath, 'utf8');
    expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('old FC format'));
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('no resources section found'));
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should handle s.yaml file not found', () => {
    const mockError = { code: 'ENOENT' };
    fs.readFileSync.mockImplementation(() => {
      throw mockError;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    readResourceConfig(mockYamlPath);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockYamlPath, 'utf8');
    expect(consoleErrorSpy).toHaveBeenCalledWith(`Error: s.yaml file not found at ${mockYamlPath}`);
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should handle YAML parsing error', () => {
    const mockYamlContent = 'invalid: [yaml: content'; // Invalid YAML
    fs.readFileSync.mockReturnValue(mockYamlContent);
    const mockError = new Error('YAML parsing error');
    mockError.name = 'YAMLException'; // Simulate js-yaml error
    yaml.load.mockImplementation(() => {
      throw mockError;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    readResourceConfig(mockYamlPath);

    expect(fs.readFileSync).toHaveBeenCalledWith(mockYamlPath, 'utf8');
    expect(yaml.load).toHaveBeenCalledWith(mockYamlContent);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Error reading or parsing s.yaml:', mockError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Please check the syntax of your s.yaml file.');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should call s preview when options.preview is true', () => {
    const mockYamlContent = `
resources:
  resourceX: {}
`;
    const mockParsedConfig = { resources: { resourceX: {} } };
    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    execSync.mockReturnValue({ stdout: '', stderr: '' }); // Mock successful execution

    const options = { preview: true };
    readResourceConfig(mockYamlPath, options);

    expect(execSync).toHaveBeenCalledWith('s  preview --silent', { stdio: 'pipe' });
    // Add assertions for result if needed, though main logic is just calling s
  });

  it('should call s verify when options.verify is true', () => {
    const mockYamlContent = `
resources:
  resourceX: {}
`;
    const mockParsedConfig = { resources: { resourceX: {} } };
    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    execSync.mockReturnValue({ stdout: '', stderr: '' }); // Mock successful execution

    const options = { verify: true };
    readResourceConfig(mockYamlPath, options);

    expect(execSync).toHaveBeenCalledWith('s  verify --silent', { stdio: 'pipe' });
    // Add assertions for result if needed
  });

  it('should handle s preview failure', () => {
    const mockYamlContent = `
resources:
  resourceX: {}
`;
    const mockParsedConfig = { resources: { resourceX: {} } };
    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    
    const mockExecError = new Error('Preview failed');
    mockExecError.stdout = Buffer.from('Preview stdout');
    mockExecError.stderr = Buffer.from('Preview stderr');
    execSync.mockImplementation(() => {
      throw mockExecError;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    const options = { preview: true };
    readResourceConfig(mockYamlPath, options);

    expect(execSync).toHaveBeenCalledWith('s  preview --silent', { stdio: 'pipe' });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Validation failed using 's  preview --silent':", mockExecError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stdout:', 'Preview stdout');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stderr:', 'Preview stderr');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should handle s verify failure', () => {
    const mockYamlContent = `
resources:
  resourceX: {}
`;
    const mockParsedConfig = { resources: { resourceX: {} } };
    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    
    const mockExecError = new Error('Verify failed');
    mockExecError.stdout = Buffer.from('Verify stdout');
    mockExecError.stderr = Buffer.from('Verify stderr');
    execSync.mockImplementation(() => {
      throw mockExecError;
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const processExitSpy = jest.spyOn(process, 'exit').mockImplementation(() => {});

    const options = { verify: true };
    readResourceConfig(mockYamlPath, options);

    expect(execSync).toHaveBeenCalledWith('s  verify --silent', { stdio: 'pipe' });
    expect(consoleErrorSpy).toHaveBeenCalledWith("Validation failed using 's  verify --silent':", mockExecError.message);
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stdout:', 'Verify stdout');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Stderr:', 'Verify stderr');
    expect(processExitSpy).toHaveBeenCalledWith(1);

    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  it('should use custom template path in s preview/verify commands', () => {
    const customPath = './custom-s.yaml';
    const mockYamlContent = `
resources:
  resourceX: {}
`;
    const mockParsedConfig = { resources: { resourceX: {} } };
    fs.readFileSync.mockReturnValue(mockYamlContent);
    yaml.load.mockReturnValue(mockParsedConfig);
    execSync.mockReturnValue({ stdout: '', stderr: '' });

    const optionsPreview = { preview: true, template: customPath };
    readResourceConfig(customPath, optionsPreview);
    expect(execSync).toHaveBeenCalledWith(`s -t ${customPath} preview --silent`, { stdio: 'pipe' });

    const optionsVerify = { verify: true, template: customPath };
    readResourceConfig(customPath, optionsVerify);
    expect(execSync).toHaveBeenCalledWith(`s -t ${customPath} verify --silent`, { stdio: 'pipe' });
  });
});