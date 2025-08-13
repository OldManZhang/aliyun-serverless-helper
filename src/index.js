#!/usr/bin/env node

const { program } = require('commander');
const inquirer = require('inquirer');
const { readResourceConfig } = require('./config');
const { handleDeploy } = require('./handlers/deployHandler');
const { handleInvoke } = require('./handlers/invokeHandler');
const { 
  handleInstanceList, 
  handleInstanceLog, 
  handleInstanceExec, 
  handleInstanceInteractive 
} = require('./handlers/instanceHandler');
const { selectResource } = require('./utils');

// Update the handleInteractive function to include instance operations
async function handleInteractive(options) {
  // Get the config path, prioritizing template option over config option
  const yamlPath = options.template || options.config || './s.yaml';
  const resourcesList = readResourceConfig(yamlPath, options);

  const answer = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Select an action:',
      choices: ['deploy', 'invoke', 'instance']
    }
  ]);

  if (answer.action === 'instance') {
    // If instance is selected, prompt for the instance subcommand
    await handleInstanceInteractive(options);
  } else {
    // For non-instance actions, prompt for resource selection
    const resourceName = await selectResource(resourcesList, 'Select a resource:');
    
    if (answer.action === 'deploy') {
      await handleDeploy(resourceName, options);
    } else if (answer.action === 'invoke') {
      await handleInvoke(resourceName, options);
    }
  }
}

// Main program
program
  .name('sr')
  .description('Enhanced CLI for Serverless Devs')
  .version(require('../package.json').version)
  .option('-t, --template <path>', 'Specify the template file (same as -c)', './s.yaml')
  .option('--preview', 'Validate s.yaml using s preview before execution')
  .option('--verify', 'Validate s.yaml using s verify before execution');

// Add command validation
program.on('command:*', (operands) => {
  const [command] = operands;
  const validCommands = ['deploy', 'invoke', 'instance'];
  const validInstanceCommands = ['list', 'log', 'exec'];
  
  // Check if it's a misspelled main command
  if (!validCommands.includes(command)) {
    console.error(`Error: Unknown command '${command}'`);
    console.log(`Did you mean one of these?`);
    validCommands.forEach(cmd => console.log(`  ${cmd}`));
    process.exit(1);
  }
  
  // Check if it's a misspelled instance subcommand
  if (command === 'instance' && operands.length > 1) {
    const subcommand = operands[1];
    if (!validInstanceCommands.includes(subcommand)) {
      console.error(`Error: Unknown instance subcommand '${subcommand}'`);
      console.log(`Did you mean one of these?`);
      validInstanceCommands.forEach(cmd => console.log(`  ${cmd}`));
      process.exit(1);
    }
  }
});

program
  .command('deploy [resourceName]')
  .description('Deploy a resource')
  .action((resourceName, cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleDeploy(resourceName, options);
  });

// Add the invoke command
program
  .command('invoke [resourceName]')
  .description('Invoke a resource')
  .action((resourceName, cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInvoke(resourceName, options);
  });

// After existing commands, add instance command with subcommands
const instanceCommand = program
  .command('instance')
  .description('Instance operations')
  .action((cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInstanceInteractive(options);
  });

instanceCommand
  .command('list')
  .description('List resource instances')
  .action((cmdObj) => {
    // Get options from the root program
    const options = program.opts();
    handleInstanceList(options);
  });

instanceCommand
  .command('log <instanceId>')
  .description('View instance logs')
  .option('-r, --resource <name>', 'Specify resource name')
  .action((instanceId, cmdObj) => {
    // Get options from the root program
    const options = { ...program.opts(), resource: cmdObj.resource };
    handleInstanceLog(instanceId, options);
  });

instanceCommand
  .command('exec <instanceId>')
  .description('Execute command on instance')
  .option('-r, --resource <name>', 'Specify resource name')
  .action((instanceId, cmdObj) => {
    // Get options from the root program
    const options = { ...program.opts(), resource: cmdObj.resource };
    handleInstanceExec(instanceId, options);
  });

// Add this to handle the case when no command is given, just options
program
  .action(() => {
    // Check if command was provided but is invalid
    const args = process.argv.slice(2);
    if (args.length > 0 && !args[0].startsWith('-')) {
      const command = args[0];
      const validCommands = ['deploy', 'invoke', 'instance'];
      
      if (!validCommands.includes(command)) {
        console.error(`Error: Unknown command '${command}'`);
        console.log(`Did you mean one of these?`);
        validCommands.forEach(cmd => console.log(`  ${cmd}`));
        process.exit(1);
      }
    }
    
    // This will only run if no specific command was matched or only options were provided
    handleInteractive(program.opts());
  });

// 导出函数供测试使用
module.exports = {
  readResourceConfig,
  handleDeploy,
  handleInvoke,
  handleInstanceList,
  handleInstanceLog,
  handleInstanceExec,
  handleInteractive,
  handleInstanceInteractive
};

// 只在非测试环境中执行程序
if (require.main === module) {
  program.parse(process.argv);
}