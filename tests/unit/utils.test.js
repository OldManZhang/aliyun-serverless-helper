// tests/unit/utils.test.js
const { execSync } = require('child_process');
const { executeCommand, getInstanceIds } = require('../../src/utils');

// Mock child_process
jest.mock('child_process');

describe('utils.js', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('executeCommand', () => {
    it('should execute a command successfully', () => {
      const command = 's test command';
      execSync.mockReturnValue({ stdout: 'success', stderr: '' });

      const result = executeCommand(command);

      expect(execSync).toHaveBeenCalledWith(command, { stdio: 'inherit' });
      expect(result).toBe(true);
    });

    it('should handle command execution failure', () => {
      const command = 's failing command';
      const mockError = new Error('Command failed');
      execSync.mockImplementation(() => {
        throw mockError;
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = executeCommand(command);

      expect(execSync).toHaveBeenCalledWith(command, { stdio: 'inherit' });
      expect(consoleErrorSpy).toHaveBeenCalledWith('Command failed:', mockError.message);
      expect(result).toBe(false);

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getInstanceIds', () => {
    it('should return instance IDs from JSON output', async () => {
      const resourceName = 'functionA';
      const mockOptions = {};
      const mockJsonOutput = JSON.stringify({
        instances: [
          { instanceId: 'i-123', createdTimeMs: 1678886400000 },
          { instanceId: 'i-456', createdTimeMs: 1678886500000 }
        ]
      });
      execSync.mockReturnValue(mockJsonOutput);

      // Mock Date.toLocaleString to return a fixed value for consistent testing
      const toLocaleStringSpy = jest.spyOn(Date.prototype, 'toLocaleString')
        .mockReturnValue('2023-03-15 20:20:00');

      const result = await getInstanceIds(resourceName, mockOptions);

      expect(execSync).toHaveBeenCalledWith(
        `s  ${resourceName} instance list --silent -o json`,
        { encoding: 'utf-8' }
      );
      expect(result).toEqual([
        { name: 'i-123 (created: 2023-03-15 20:20:00)', value: 'i-123' },
        { name: 'i-456 (created: 2023-03-15 20:20:00)', value: 'i-456' }
      ]);
      
      // Restore the original toLocaleString method
      toLocaleStringSpy.mockRestore();
    });

    it('should return instance IDs from text output if JSON parsing fails', async () => {
      const resourceName = 'functionA';
      const mockOptions = {};
      const mockTextOutput = `# Instance List
i-123 some-other-info
i-456 more-info`;
      execSync.mockReturnValue(mockTextOutput);
      // Mock JSON.parse to throw an error to trigger fallback
      jest.spyOn(JSON, 'parse').mockImplementationOnce(() => {
        throw new Error('Invalid JSON');
      });

      const result = await getInstanceIds(resourceName, mockOptions);

      expect(execSync).toHaveBeenCalledWith(
        `s  ${resourceName} instance list --silent -o json`,
        { encoding: 'utf-8' }
      );
      expect(result).toEqual([
        { name: 'i-123', value: 'i-123' },
        { name: 'i-456', value: 'i-456' }
      ]);
      
      // Restore JSON.parse
      JSON.parse.mockRestore();
    });

    it('should handle execSync error', async () => {
      const resourceName = 'functionA';
      const mockOptions = {};
      const mockError = new Error('Command failed');
      mockError.stderr = Buffer.from('Some error details');
      execSync.mockImplementation(() => {
        throw mockError;
      });
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getInstanceIds(resourceName, mockOptions);

      expect(execSync).toHaveBeenCalledWith(
        `s  ${resourceName} instance list --silent -o json`,
        { encoding: 'utf-8' }
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to fetch instances:', mockError.message);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error details:', 'Some error details');
      expect(result).toEqual([]);

      consoleErrorSpy.mockRestore();
    });

    it('should return empty array if no instances found', async () => {
      const resourceName = 'functionA';
      const mockOptions = {};
      execSync.mockReturnValue(''); // Empty output

      const result = await getInstanceIds(resourceName, mockOptions);

      expect(execSync).toHaveBeenCalledWith(
        `s  ${resourceName} instance list --silent -o json`,
        { encoding: 'utf-8' }
      );
      expect(result).toEqual([]);
    });

    it('should return empty array if function name is not provided', async () => {
      const mockOptions = {};
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await getInstanceIds(null, mockOptions);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error: Function name is required');
      expect(result).toEqual([]);
      
      consoleErrorSpy.mockRestore();
    });
    
    it('should use custom template path', async () => {
      const resourceName = 'functionA';
      const customPath = './custom-s.yaml';
      const mockOptions = { template: customPath };
      const mockJsonOutput = JSON.stringify({
        instances: [
          { instanceId: 'i-123' }
        ]
      });
      execSync.mockReturnValue(mockJsonOutput);

      const result = await getInstanceIds(resourceName, mockOptions);

      expect(execSync).toHaveBeenCalledWith(
        `s -t ${customPath} ${resourceName} instance list --silent -o json`,
        { encoding: 'utf-8' }
      );
      expect(result).toEqual([
        { name: 'i-123', value: 'i-123' }
      ]);
    });
  });
});