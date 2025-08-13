const fs = require('fs');
const yaml = require('js-yaml');
const { execSync } = require('child_process');

/**
 * Reads the s.yaml file and extracts resource names.
 * Only supports FC3 format (resources section).
 * For FC format (services section), it suggests upgrading.
 * Validation is delegated to 's preview' or 's verify'.
 * @param {string} [yamlPath='./s.yaml'] - Path to the s.yaml file.
 * @param {Object} options - Command line options.
 * @returns {Array<string>} - List of resource names.
 */
function readResourceConfig(yamlPath = './s.yaml', options = {}) {
  try {
    // Delegate validation to s tool if requested
    if (options.preview || options.verify) {
      const templateOption = yamlPath !== './s.yaml' ? `-t ${yamlPath}` : '';
      const validateCommand = options.preview 
        ? `s ${templateOption} preview --silent` 
        : `s ${templateOption} verify --silent`;
      
      try {
        execSync(validateCommand, { stdio: 'pipe' }); // Use 'pipe' to capture output if needed
        // Optionally log success if needed for debugging, but usually silent
        // console.log(`Validation successful using '${validateCommand}'`);
      } catch (validationError) {
        console.error(`Validation failed using '${validateCommand}':`, validationError.message);
        if (validationError.stdout) console.error('Stdout:', validationError.stdout.toString());
        if (validationError.stderr) console.error('Stderr:', validationError.stderr.toString());
        process.exit(1);
      }
    }

    const fileContents = fs.readFileSync(yamlPath, 'utf8');
    const config = yaml.load(fileContents);

    // Check for old FC format
    if (config.services) {
      console.warn('Warning: Detected old FC format (services section). Please consider upgrading to FC3 (resources section) for full compatibility.');
      // Depending on strictness, you could choose to exit here or just warn
      // For now, let's just warn and proceed if resources also exist, otherwise exit
      if (!config.resources) {
         console.error('Error: Old FC format detected and no resources section found. Please upgrade your s.yaml to FC3 format.');
         process.exit(1);
      }
      // If both exist, we'll prioritize resources as per FC3, but warn about services
    }

    // Extract resource names from resources section (FC3 format)
    const resources = [];
    if (config.resources) {
      for (const [resourceName, resourceConfig] of Object.entries(config.resources)) {
        resources.push(resourceName);
      }
    } else {
        // This case is already handled by the FC check above, but good for clarity
        console.warn('No resources found in s.yaml file. Make sure the file contains a resources section (FC3 format).');
        // Or could be an error depending on strictness
        // console.error('Error: s.yaml must contain a resources section (FC3 format).');
        // process.exit(1);
    }

    return resources;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.error(`Error: s.yaml file not found at ${yamlPath}`);
    } else {
      console.error('Error reading or parsing s.yaml:', error.message);
      // Provide more context if it's a YAML parsing error
      if (error.name === 'YAMLException') {
          console.error('Please check the syntax of your s.yaml file.');
      }
    }
    process.exit(1);
  }
}

module.exports = { readResourceConfig };