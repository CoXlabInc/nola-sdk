'use babel';

import { CompositeDisposable } from 'atom';
import CreateProjectView from './create-project-view';
import DeviceSelectView from './device-select-view';
import PortSelectView from './port-select-view';

path = require('path');
fs = require('fs-extra');

export default class ControlPanelView {
  createProjectView: null;
  devSelectView: null;
  portSelectView: null;
  panel: null;

  imgLogo: null;
  btnNewProject: null;
  btnOpenProject: null;
  btnBuildProject: null;
  btnCleanProject: null;
  btnProject: null;
  btnCloseProject: null;
  btnDevSelect: null;
  textDevLibVer: null;
  btnUpdateLib: null;
  btnPortSelect: null;
  btnHide: null;

  currentProjectPath: null;
  buildTarget: null;

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');
    this.element.classList.add('nola-sdk-tool-bar');

    this.imgLogo = document.createElement('img');
    this.imgLogo.src = 'atom://nola-sdk/images/A.png';
    this.imgLogo.height = 30;
    this.element.appendChild(this.imgLogo);

    this.btnNewProject = document.createElement('button');
    this.btnNewProject.classList.add('btn');
    this.btnNewProject.classList.add('tool-bar-btn');
    this.btnNewProject.classList.add('icon');
    this.btnNewProject.classList.add('icon-file');
    this.element.appendChild(this.btnNewProject);

    this.btnOpenProject = document.createElement('button');
    this.btnOpenProject.classList.add('btn');
    this.btnOpenProject.classList.add('tool-bar-btn');
    this.btnOpenProject.classList.add('icon');
    this.btnOpenProject.classList.add('icon-file-directory');
    this.element.appendChild(this.btnOpenProject);

    this.btnProject = document.createElement('button');
    this.btnProject.classList.add('btn');
    this.btnProject.classList.add('tool-bar-btn');
    this.btnProject.textContent = 'Please create or open project.';
    this.element.appendChild(this.btnProject);

    this.btnCloseProject = document.createElement('button');
    this.btnCloseProject.classList.add('btn');
    this.btnCloseProject.classList.add('tool-bar-btn');
    this.btnCloseProject.classList.add('icon');
    this.btnCloseProject.classList.add('icon-x');
    this.element.appendChild(this.btnCloseProject);

    this.btnDevSelect = document.createElement('button');
    this.btnDevSelect.classList.add('btn');
    this.btnDevSelect.classList.add('tool-bar-btn');
    this.btnDevSelect.classList.add('icon');
    this.btnDevSelect.classList.add('icon-circuit-board');
    this.btnDevSelect.textContent = ' Select your device.';
    this.btnDevSelect.disabled = true;
    this.element.appendChild(this.btnDevSelect);

    this.textDevLibVer = document.createElement('code');
    this.textDevLibVer.textContent = '';
    this.element.appendChild(this.textDevLibVer);

    this.btnUpdateLib = document.createElement('button');
    this.btnUpdateLib.classList.add('btn');
    this.btnUpdateLib.classList.add('tool-bar-btn');
    this.btnUpdateLib.classList.add('icon');
    this.btnUpdateLib.classList.add('icon-desktop-download');
    this.element.appendChild(this.btnUpdateLib);

    this.btnPortSelect = document.createElement('button');
    this.btnPortSelect.classList.add('btn');
    this.btnPortSelect.classList.add('tool-bar-btn');
    this.btnPortSelect.classList.add('icon');
    this.btnPortSelect.classList.add('icon-plug');
    this.btnPortSelect.textContent = ' None';
    this.element.appendChild(this.btnPortSelect);

    this.btnBuildProject = document.createElement('button');
    this.btnBuildProject.classList.add('btn');
    this.btnBuildProject.classList.add('tool-bar-btn');
    this.btnBuildProject.classList.add('icon');
    this.btnBuildProject.classList.add('icon-triangle-right');
    this.btnBuildProject.disabled = true;
    this.element.appendChild(this.btnBuildProject);

    this.btnCleanProject = document.createElement('button');
    this.btnCleanProject.classList.add('btn');
    this.btnCleanProject.classList.add('tool-bar-btn');
    this.btnCleanProject.classList.add('icon');
    this.btnCleanProject.classList.add('icon-trashcan');
    this.btnCleanProject.disabled = true;
    this.element.appendChild(this.btnCleanProject);

    this.btnHide = document.createElement('button');
    this.btnHide.classList.add('btn');
    this.btnHide.classList.add('tool-bar-btn');
    this.btnHide.classList.add('icon');
    this.btnHide.classList.add('icon-triangle-up');
    this.btnHide.classList.add('pull-right');
    this.element.appendChild(this.btnHide);

    this.panel = atom.workspace.addTopPanel({
      item: this.element,
      visible: false,
    });

    this.createProjectView = new CreateProjectView(serializedState, this);
    this.devSelectView = new DeviceSelectView(serializedState, this);
    this.portSelectView = new PortSelectView(serializedState, this);

    this.btnNewProject.addEventListener('click', this);
    this.btnOpenProject.addEventListener('click', this);
    this.btnProject.addEventListener('click', this);
    this.btnCloseProject.addEventListener('click', this);
    this.btnDevSelect.addEventListener('click', this);
    this.btnUpdateLib.addEventListener('click', this);
    this.btnPortSelect.addEventListener('click', this);
    this.btnBuildProject.addEventListener('click', this);
    this.btnCleanProject.addEventListener('click', this);
    this.btnHide.addEventListener('click', this);

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:createProject': () => this.createProject(),
      'nola-sdk:closeProject': () => this.closeProject(),
      'nola-sdk:buildProject': () => this.buildProject()
    }));
  }

  handleEvent(event) {
    if (event.target == this.btnNewProject && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:createProject');
    } else if (event.target == this.btnOpenProject && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:openProject');
    } else if (event.target == this.btnProject && this.currentProjectPath != undefined && event.type == 'click') {
      atom.project.addPath(this.currentProjectPath);
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
      atom.workspace.open(this.currentProjectPath + path.sep + 'main.cpp');
    } else if (event.target == this.btnCloseProject && event.type == 'click') {
      this.closeProject();
    } else if (event.target == this.btnDevSelect && event.type == 'click') {
      this.devSelectView.toggle();
    } else if (event.target == this.btnPortSelect && event.type == 'click') {
      this.portSelectView.toggle();
    } else if (event.target == this.btnUpdateLib && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:updateSdk');
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:checkToolchain');
    } else if (event.target == this.btnBuildProject && event.type == 'click') {
      this.buildProject();
    } else if (event.target == this.btnCleanProject && event.type == 'click') {
      this.cleanProject();
    } else if (event.target == this.btnHide && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:hideControlPanel');
    }
  }

  refreshLibVer() {
    if (this.devSelectView != undefined && this.devSelectView.curDev != undefined) {
      this.textDevLibVer.textContent = this.devSelectView.curDev.libVersion;
    }
  }

  show() {
    if (this.panel.isVisible() == false) {
      this.panel.show();
    }
  }

  hide() {
    if (this.panel.isVisible()) {
      this.panel.hide();
    }
  }

  destroy() {
    this.element.remove();
  }

  setProject(projectPath) {
    if (projectPath != null) {
      this.currentProjectPath = projectPath;
      this.btnProject.textContent = 'Project: ' + path.basename(projectPath);
      this.devSelectView.loadDevice();
      atom.project.addPath(projectPath);
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
      atom.workspace.open(this.currentProjectPath + path.sep + 'main.cpp');
      this.btnDevSelect.disabled = false;
      this.btnCloseProject.disabled = false;
      this.btnBuildProject.disabled = false;
      this.btnCleanProject.disabled = false;
      this.refreshBuild();
    } else {
      if (this.currentProjectPath != undefined) {
        var editors = atom.workspace.getTextEditors();
        var projectEditors = [];
        var detailedMessage = '';
        for (var i in editors) {
          if (editors[i].getPath() != undefined && editors[i].getPath().indexOf(this.currentProjectPath) == 0) {
            projectEditors.push(editors[i]);
            detailedMessage += editors[i].getTitle() + '\n';
          }
        }

        if (projectEditors.length > 0) {
          const buttons = [ 'Cancel', 'No', 'Yes' ];
          var answer = atom.confirm({
            message: 'Do you want to close all files of the project?',
            detailedMessage: detailedMessage,
            buttons: buttons,
          });

          if (buttons[answer] == 'Cancel') {
            return;
          } else if (buttons[answer] == 'Yes') {
            for (var i in projectEditors) {
              const buttonsSave = [ 'No', 'Yes' ];
              if (projectEditors[i].isModified()) {
                var answerSave = atom.confirm({
                  message: '\'' + projectEditors[i] + '\' has changes, do you want to save them?',
                  detailedMessage: 'Your changes will be lost if you close this item without saving.',
                  buttons: buttonsSave,
                });

                if (buttonsSave[answerSave] == 'Yes') {
                  projectEditors[i].save();
                }
              }
              projectEditors[i].destroy();
            }
          }
        }

        atom.project.removePath(this.currentProjectPath);
        this.btnProject.textContent = 'Please create or open project.';
        this.btnDevSelect.textContent = ' Select your device.';
        this.textDevLibVer.textContent = '';
      }
      this.currentProjectPath = null;
      this.btnCloseProject.disabled = true;
      this.btnDevSelect.disabled = true;
      this.btnBuildProject.disabled = true;
      this.btnCleanProject.disabled = true;
    }
  }

  createProject() {
    this.createProjectView.show();
  }

  closeProject() {
    this.setProject(null);
  }

  buildProject() {
    if (this.currentProjectPath == undefined) {
      return;
    }

    const mainPath = this.currentProjectPath + path.sep + 'main.cpp';

    try {
      fs.statSync(mainPath);
    } catch(e) {
      atom.notifications.addWarning('No \'main.cpp\' found!', {
        detail: 'Make sure that the \'main.cpp\' exists in the current project directory.',
      });

      return;
    }

    var projectInfo;

    try {
      projectInfo = JSON.parse(fs.readFileSync(this.currentProjectPath + path.sep + 'Nol.A-project.json').toString());
    } catch (e) {
      atom.notifications.addWarning('No \'Nol.A-project.json\' found!', {
        detail: 'Make sure that the \'Nol.A-project.json\' exists in the current project directory.',
      });

      return;
    }

    if (projectInfo.board == undefined || this.devSelectView.curDev == undefined) {
      atom.notifications.addWarning('Target device is not specified!', {
        detail: 'Select your device. You can choose it by clicking the device select button on the control panel.',
      });
      return;
    }

    if (atom.config.get('nola-sdk.hwLibDevMode') == true) {
      var p = atom.config.get('nola-sdk.hwLibSourcePath');

      if (path.isAbsolute(p) == false) {
        atom.notifications.addWarning('The hardware library source path is not absolute.', {
          detail: `\'${p}\' is not an absolue path. The build is canceled.`
        });
        return;
      }

      projectInfo.hwLibSrc = p;
    }

    if (atom.config.get('nola-sdk.deviceDriverDevMode') == true) {
      var p = atom.config.get('nola-sdk.deviceDriverSourcePath');

      if (path.isAbsolute(p) == false) {
        atom.notifications.addWarning('The Device Driver source path is not absolute.', {
          detail: `\'${p}\' is not an absolue path. The build is canceled.`
        });
        return;
      }

      projectInfo.devDrvSrc = p;
    }

    this.buildTarget = mainPath;

    projectInfo.port = this.portSelectView.curPort.trim();
    projectInfo.ver = this.devSelectView.curDev.libVersion;

    var disp = atom.workspace.onDidOpen((event) => {
      if (this.buildTarget != undefined && this.buildTarget == event.uri) {
        atom.commands.dispatch(atom.views.getView(atom.workspace), 'build:trigger');
        disp.dispose();
      }
    });

    fs.mkdir(this.currentProjectPath + path.sep + 'build', (err) => {
      if (err && err.code !== 'EEXIST') throw err;
      fs.writeFile(
        this.currentProjectPath + path.sep + 'build' + path.sep + 'build.json',
        JSON.stringify(projectInfo, null, ' '),
        (err) => {
          if (err) throw err;
          atom.workspace.open(mainPath);
        }
      );
    });
  }

  cleanProject() {
    if (this.currentProjectPath == undefined) {
      return;
    }

    var hwLibSrcPath;

    if (atom.config.get('nola-sdk.hwLibDevMode') == true) {
      hwLibSrcPath = atom.config.get('nola-sdk.hwLibSourcePath');

      if (path.isAbsolute(hwLibSrcPath) == false) {
        hwLibSrcPath = '';
      }
    } else {
      hwLibSrcPath = '';
    }

    fs.remove(this.currentProjectPath + path.sep + 'build', () => {
      if (hwLibSrcPath == '') {
        atom.notifications.addInfo("Clean done!", {
          detail: 'Project: ' + this.currentProjectPath,
        });
      } else {
        fs.remove(hwLibSrcPath + path.sep + 'build' + path.sep + this.devSelectView.curDev.libType, () => {
          atom.notifications.addInfo("Clean done!", {
            detail: 'Project: ' + this.currentProjectPath + '\n' + 'Hardware library output files: ' + hwLibSrcPath + path.sep + 'build' + path.sep + this.devSelectView.curDev.libType,
          });
        });
      }
    });
  }

  refreshBuild() {
    var buildContext = [];

    if (this.devSelectView.curDev == undefined) {
      buildContext.push({
        'curdev':'undefined',
      });
    } else {
      buildContext.push({
        'curdev': this.devSelectView.curDev.libType,
      });
    }

    buildContext.push({
      'curport': this.portSelectView.curPort,
    });

    atom.config.set('nola-sdk.build', buildContext);
  }
}
