'use babel';
/*
import { View } from 'space-pen';


import fs from 'fs-plus';
import utils from './utils';
*/

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
    var dir = require('remote').require('dialog').showOpenDialog({
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

    var projectPath = workspacePath + require('path').sep + projectName;

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

    /*
    fs.copySync(@installPath + @sep + "sample-proj" + @sep + "config", projectPath)
    if fs.existsSync(projectPath + @sep + "main.cpp") == false
      fs.copySync(@installPath + @sep + "sample-proj" + @sep + "template", projectPath)
    */

    this.modalPanel.hide();
    console.log('Project paths: ' + atom.project.getPaths());
    atom.project.addPath(projectPath);
    atom.workspace.open(projectPath);
    atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show');

/*

if fs.existsSync(workspacePath) == true



  @coxide.projectPath = projectPath
  @modalPanel.hide()
  atom.project.setPaths([projectPath])
  atom.commands.dispatch(atom.views.getView(atom.workspace), 'tree-view:show')
  atom.commands.dispatch(atom.views.getView(atom.workspace), 'build:clear')
else
  alert 'Invalid Workspace Path.'

*/
  }

  doShow() {
    if (this.modalPanel.isVisible() == false) {
      this.modalPanel.show();
    }
  }
}

  /*

    initialize: (p) ->
      @coxide = p
      @modalPanel = atom.workspace.addModalPanel(item: @element, visible: false)
      @btnWorkspacePath.on 'click', => @selectWorkspacePath()
      @btnDoCreateProj.on 'click', => @doCreateProj()
      @btnCancel.on 'click', =>  @modalPanel.hide()
      @sep = utils.getSeperator()
      @installPath = utils.getInstallPath()

    doShow: ->
      if @modalPanel.isVisible() is false
        @modalPanel.show()


    selectWorkspacePath: ->
      responseChannel = "atom-create-project-response"
      ipc.on responseChannel, (path) =>
        ipc.removeAllListeners(responseChannel)
        if path isnt null
          if fs.existsSync(path[0] + @sep + ".atom-build.json") == false
            @edtWorkspacePath.setText(path[0])
          else
            alert('The selected path is including a project. Please select another path for workspace.');
      ipc.send('create-project', responseChannel)

    doCreateProj:  ->
  */

//}
