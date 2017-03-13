'use babel';

path = require('path');

export default class CreateProjectView {
  modalPanel: null;
  btnCancel: null;
  btnWorkspacePath: null;
  edtWorkspacePath: null;
  edtProjName: null;
  btnDoCreateProj: null;

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');

    // Create message element
    const title = document.createElement('h1');
    title.textContent = 'Create Project';
    title.classList.add('icon');
    title.classList.add('icon-plus');
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
    var dir = require('remote').dialog.showOpenDialog({
      properties:['openDirectory', 'createDirectory']
    });

    this.edtWorkspacePath.getModel().setText(dir[0]);
  }

  doCreateProj() {
    var projectName = this.edtProjName.getModel().getText();
    if (projectName == '') {
      alert('Invalid project name.');
      return;
    }

    var workspacePath = this.edtWorkspacePath.getModel().getText();
    const fs = require('fs');

    try {
      fs.statSync(workspacePath);
    } catch(ex) {
      fs.mkdir(workspacePath);
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

    fs.mkdir(projectPath);

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

    this.modalPanel.hide();
    atom.project.addPath(projectPath);
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');
    atom.workspace.open(projectPath + path.sep + 'main.cpp');

    const templateBuild = {
      "cmd": app.getPath('home') + path.sep + '.atom' + path.sep + 'nola-sdk' + path.sep + 'make' + path.sep + 'build.sh',
      "args": [
        "nol.board",
        "None"
      ],
      "sh": true,
      "env": {},
    };

    fs.writeFileSync(projectPath + path.sep + '.atom-build.json', JSON.stringify(templateBuild));

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
