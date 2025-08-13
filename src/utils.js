const { execSync } = require('child_process');
const fuzzy = require('fuzzy');
const inquirer = require('inquirer');

// Function to execute command
function executeCommand(command, options) {
  try {
    console.log(`Executing: ${command}`);
    
    // Add silent and output format flags if specified
    const fullCommand = `${command}`.trim();
    
    execSync(fullCommand, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error('Command failed:', error.message);
    return false;
  }
}

// Function to get instance IDs for a function
async function getInstanceIds(resourceName, options) {
  if (!resourceName) {
    console.error('Error: Function name is required');
    return [];
  }

  const yamlPath = options.template || options.config || './s.yaml';
  
  // Include the s.yaml path in the command using s's -t flag
  const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
  
  // Always use --silent when fetching instance IDs
  // Always use -o json to get JSON formatted output
  const command = `s ${templateOption} ${resourceName} instance list --silent -o json`.trim();
  
  try {
    // console.log(`Fetching instances for ${resourceName}...`);
    // console.log(`Debug - Command: ${command}`);
    
    const result = execSync(command, { encoding: 'utf-8' });
    
    if (!result || result.trim() === '') {
      // console.log(`No instances found for ${resourceName}`);
      return [];
    }
    
    // console.log('Debug - Raw result:', result);
    
    try {
      // Parse the JSON result
      const data = JSON.parse(result);
      
      // Check if instances are nested under "instances" key
      const instances = data.instances || data;
      
      if (!instances || !instances.length) {
        // console.log(`No instances found for ${resourceName}`);
        return [];
      }
      
      // Extract instance IDs and add more information
      return instances.map(instance => {
        // Extract date info if available (from createdTimeMs)
        const dateInfo = instance.createdTimeMs ? 
          `(created: ${new Date(instance.createdTimeMs).toLocaleString()})` : '';
          
        // Use instanceId as the primary identifier
        const label = `${instance.instanceId} ${dateInfo}`.trim();
        
        return {
          name: label,
          value: instance.instanceId
        };
      });
    } catch (jsonError) {
      // console.error('Debug - JSON parse error:', jsonError.message);
      // console.error('Debug - JSON content:', result);
      
      // Fallback: parse the output as text
      const lines = result.split('\n');
      const instances = [];
      
      // Simple parsing of the text output to extract instance IDs
      for (const line of lines) {
        const trimmedLine = line.trim();
        // Look for lines that might contain instance IDs
        if (trimmedLine && (trimmedLine.includes('c-') || trimmedLine.includes('i-')) && !trimmedLine.startsWith('#')) {
          // Support both FC and FC3 instance ID formats
          const parts = trimmedLine.split(/\s+/);
          const instanceId = parts.find(part => part.startsWith('c-') || part.startsWith('i-')) || parts[0];
          instances.push({
            name: instanceId,
            value: instanceId
          });
        }
      }
      
      if (instances.length === 0) {
        // console.log(`No instances found for ${resourceName}`);
      }
      
      return instances;
    }
  } catch (error) {
    console.error('Failed to fetch instances:', error.message);
    if (error.stderr) {
      console.error('Error details:', error.stderr.toString());
    }
    return [];
  }
}

// Function to select a resource with sorting and fuzzy search
async function selectResource(resourcesList, message) {
  // Dynamically import inquirer-autocomplete-prompt
  const autocomplete = (await import('inquirer-autocomplete-prompt')).default;
  
  // Register the autocomplete prompt
  inquirer.registerPrompt('autocomplete', autocomplete);
  
  // Sort the resources list
  const sortedResources = resourcesList.sort();
  
  // Create a custom prompt using inquirer's autocomplete type
  const answer = await inquirer.prompt([
    {
      type: 'autocomplete',
      name: 'selectedResource',
      message: message || 'Select a resource:',
      source: (answersSoFar, input) => {
        input = input || '';
        return new Promise(resolve => {
          // Use fuzzy search to filter resources
          const fuzzyResult = fuzzy.filter(input, sortedResources);
          
          // Map the results to include highlighted names
          const results = fuzzyResult.map(element => {
            return {
              name: element.string, // This will be the highlighted version
              value: element.original, // This is the original resource name
              short: element.original // This is what will be displayed after selection
            };
          });
          
          resolve(results);
        });
      }
    }
  ]);
  
  return answer.selectedResource;
}

module.exports = {
  executeCommand,
  getInstanceIds,
  selectResource
};