#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const args  = require('yargs').argv;

const cwd = process.cwd();
let appName;

const detectPackageName = () => {
  const packageJson = path.join(cwd, 'package.json');
  console.log(`Detecting package name from "${packageJson}"`);
  if (!fs.existsSync(packageJson)) {
    throw 'Could not detect package name from packge.json!';
  }
  const packageDescription = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
  const {
    name: packageName,
  } = packageDescription;
  return packageName;
};

const createRNExampleProject = () => {
  console.log(`Creating example project "${appName}"`);
  return execSync(`mkdir examples && cd examples && react-native init ${appName} 2>/dev/null`);
};

const copyStaticFiles = () => {
  console.log('Copying default example configurations');
  const staticFilesPath = path.resolve(__dirname, '..', 'static');
  const staticFiles = fs.readdirSync(staticFilesPath);
  staticFiles.forEach(filename => fs.copyFileSync(
    path.join(staticFilesPath, filename),
    path.join(cwd, 'examples', appName, filename),
  ));
  return renameAppNameForPresentation();
};

const renameAppNameForPresentation = () => {
  console.log('Renaming app inside App.js file');
  const appJs = path.join(cwd, 'examples', appName, 'App.js');
  let appJsContent = fs.readFileSync(appJs, 'utf-8');
  appJsContent = appJsContent.replace(/\$\{APP_NAME\}/, appName);
  return fs.writeFileSync(appJs, appJsContent);
}

const addNpmScriptsToPackage = () => {
  console.log('Adding npm helpful scripts');
  const packageJson = path.join(cwd, 'examples', appName, 'package.json');
  let packageJsonContent = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
  packageJsonContent.scripts.android = 'react-native run-android';
  packageJsonContent.scripts.ios = 'react-native run-ios';
  packageJsonContent.scripts.start = 'react-native start -- --reset-cache';
  packageJsonContent = JSON.stringify(packageJsonContent, null, 2);
  return fs.writeFileSync(packageJson, packageJsonContent);
};

const addModuleDepedency= (packageName) => {
  console.log(`Installing "${packageName}" as example dependency`);
  const examplePath = path.join(cwd, 'examples', appName);
  return execSync(`cd ${examplePath} && npm i ../../ --save 2>/dev/null`);
};

const main = () => {
  appName = args._[0];
  if (!appName) {
    throw 'Undefined app name. Execute this command as "create-react-native-example MyAppName"';
  }
  try {
    const packageName = detectPackageName();
    createRNExampleProject();
    copyStaticFiles();
    addNpmScriptsToPackage();
    addModuleDepedency(packageName);
    console.log(`
    Sucessfully created "examples/${appName}"
      cd examples/${appName}
      && npm run start
      && npm run ios or npm run android
    `);
  } catch (exception) {
    fs.unlinkSync(path.join(cwd, 'examples'));
    throw exception;
  }
};

main();
