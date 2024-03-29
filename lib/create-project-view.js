'use babel';

import { CompositeDisposable } from 'atom';

path = require('path');
fs = require('fs');

export default class CreateProjectView {
  modalPanel: null;
  btnCancel: null;
  btnWorkspacePath: null;
  edtWorkspacePath: null;
  edtProjName: null;
  btnDoCreateProj: null;
  controlPanel: null;

  constructor(serializedState, controlPanel) {
    this.controlPanel = controlPanel;

    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');

    // Create message element
    const title = document.createElement('h1');
    title.textContent = 'Create Project';
    title.classList.add('icon');
    title.classList.add('icon-file');
    const btnCancel = document.createElement('span');
    btnCancel.classList.add('pull-right');
    btnCancel.classList.add('icon');
    btnCancel.classList.add('icon-x');
    title.appendChild(btnCancel);
    this.element.appendChild(title);
    this.btnCancel = btnCancel;

    const labelName = document.createElement('h2');
    labelName.textContent = 'Project Name:';
    this.element.appendChild(labelName);

    var edtProjName = document.createElement('atom-text-editor');
    var model = edtProjName.getModel();
    model.setPlaceholderText('Please type new project name.');
    model.setMini(true);
    this.element.appendChild(edtProjName);
    this.edtProjName = edtProjName;

    const labelPath = document.createElement('h2');
    labelPath.textContent = 'Workspace Path:';
    this.element.appendChild(labelPath);

    var edtWorkspacePath = document.createElement('atom-text-editor');
    var model = edtWorkspacePath.getModel();
    model.setPlaceholderText('The new project will be created in this workspace.');
    model.setMini(true);
    const btnWorkspacePath = document.createElement('button');
    btnWorkspacePath.classList.add('btn-open-folder');
    btnWorkspacePath.classList.add('btn');
    btnWorkspacePath.classList.add('icon-file-directory');
    btnWorkspacePath.classList.add('pull-right');
    this.btnWorkspacePath = btnWorkspacePath;
    this.element.appendChild(btnWorkspacePath);
    this.element.appendChild(edtWorkspacePath);
    this.edtWorkspacePath = edtWorkspacePath;

    const labelBlank = document.createElement('h2');
    labelBlank.textContent = '';
    this.element.appendChild(labelBlank);

    const divBtn = document.createElement('div');
    divBtn.classList.add('align-center');
    const btnDoCreateProj = document.createElement('button');
    btnDoCreateProj.classList.add('align-center');
    btnDoCreateProj.classList.add('btn');
    btnDoCreateProj.classList.add('btn-size15');
    btnDoCreateProj.classList.add('icon');
    btnDoCreateProj.classList.add('icon-flame');
    btnDoCreateProj.textContent = 'Done';
    this.btnDoCreateProj = btnDoCreateProj;

    divBtn.appendChild(btnDoCreateProj);
    this.element.appendChild(divBtn);

    btnCancel.addEventListener('click', this);
    btnWorkspacePath.addEventListener('click', this);
    btnDoCreateProj.addEventListener('click', this);

    this.modalPanel = atom.workspace.addModalPanel({
      item: this.element,
      visible: false
    });

    this.subscriptions = new CompositeDisposable();
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'core:confirm': () => {
        if (this.modalPanel.isVisible()) {
          this.doCreateProj();
        }
      },
      'core:cancel': () => {
        if (this.modalPanel.isVisible()) {
          this.modalPanel.hide();
        }
      }
    }));
  }

  // Returns an object that can be retrieved when package is activated
  serialize() {}

  // Tear down any state and detach
  destroy() {
    this.element.remove();
  }

  getElement() {
    return this.element;
  }

  handleEvent(event) {
    if (event.target == this.btnCancel && event.type == 'click') {
      this.modalPanel.hide();
    } else if (event.target == this.btnWorkspacePath && event.type == 'click') {
      this.selectWorkspacePath();
    } else if (event.target == this.btnDoCreateProj && event.type == 'click') {
      this.doCreateProj();
    }
  }

  selectWorkspacePath() {
    let remote = require('electron').remote;
    remote.dialog.showOpenDialog(remote.getCurrentWindow(), {
      properties:['openDirectory', 'createDirectory']
    }).then(result => {
      if (result.canceled) {
        return;
      }

      this.edtWorkspacePath.getModel().setText(result.filePaths[0]);
    }).catch(err => {
      console.error(err);
    });
  }

  doCreateProj() {
    var projectName = this.edtProjName.getModel().getText();
    if (projectName == '') {
      alert('Invalid project name.');
      return;
    }

    var workspacePath = this.edtWorkspacePath.getModel().getText();

    try {
      fs.statSync(workspacePath);
    } catch(ex) {
      fs.mkdirSync(workspacePath);
    }

    var projectPath = workspacePath + path.sep + projectName;

    try {
      fs.statSync(projectPath);
      alert('Same project already exists.');
      return;
    } catch(ex) {
    }

    /*
    # check for currently opened project.
    if @coxide.closeProject() is false
      return
    */

    fs.mkdirSync(projectPath);

    const templateMain = '#include <cox.h>\n'
      + '\n'
      + 'Timer timerHello;\n'
      + '\n'
      + 'static void taskHello(void *) {\n'
      + '  printf("Hello World!\\n");\n'
      + '}\n'
      + '\n'
      + 'void setup() {\n'
      + '  Serial.begin(115200);\n'
      + '  timerHello.onFired(taskHello, NULL);\n'
      + '  timerHello.startPeriodic(1000);\n'
      + '}\n';

    fs.writeFileSync(projectPath + path.sep + 'main.cpp', templateMain);

    const projectInfo = {
      'board': 'nol.board'
    };

    fs.writeFileSync(projectPath + path.sep + 'Nol.A-project.json', JSON.stringify(projectInfo, null, ' '));

    try {
      fs.statSync(projectPath + path.sep + '.atom-build.json');
      // If there is .atom-build.json file that is for older versions, delete it.
      fs.removeSync(projectPath + path.sep + '.atom-build.json');
    } catch (e) {
      //Nothing to do.
    }

    this.controlPanel.setProject(projectPath);
    this.modalPanel.hide();
    atom.project.addPath(projectPath);
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
    atom.workspace.open(projectPath + path.sep + 'main.cpp');

/*
  atom.commands.dispatch(atom.views.getView(atom.workspace), 'build:clear')
*/
  }

  show() {
    if (this.modalPanel.isVisible() == false) {
      this.modalPanel.show();
    }
  }

  hide() {
    if (this.modalPanel.isVisible()) {
      this.modalPanel.hide();
    }
  }
}
