'use babel';

import DeviceSelectView from './device-select-view';

export default class ControlPanelView {
  devSelectView: null;
  portSeletView: null;
  panel: null;

  imgLogo: null;
  btnNewProject: null;
  btnOpenProject: null;
  btnBuildProject: null;
  btnCleanProject: null;
  textProjectPath: null;
  btnDevSelect: null;
  textDevLibVer: null;
  btnUpdateLib: null;
  btnPortSelect: null;
  btnClose: null;

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
    this.btnNewProject.classList.add('icon-file');
    this.element.appendChild(this.btnNewProject);

    this.btnOpenProject = document.createElement('button');
    this.btnOpenProject.classList.add('btn');
    this.btnOpenProject.classList.add('tool-bar-btn');
    this.btnOpenProject.classList.add('icon-file-directory');
    this.element.appendChild(this.btnOpenProject);

    this.textProjectPath = document.createElement('code');
    this.textProjectPath.textContent = 'Please create or open project.';
    this.element.appendChild(this.textProjectPath);

    this.btnDevSelect = document.createElement('button');
    this.btnDevSelect.classList.add('btn');
    this.btnDevSelect.classList.add('tool-bar-btn');
    this.btnDevSelect.classList.add('icon-check');
    this.btnDevSelect.textContent = ' Select your device.';
    this.element.appendChild(this.btnDevSelect);

    this.textDevLibVer = document.createElement('code');
    this.textDevLibVer.textContent = '';
    this.element.appendChild(this.textDevLibVer);

    this.btnUpdateLib = document.createElement('button');
    this.btnUpdateLib.classList.add('btn');
    this.btnUpdateLib.classList.add('tool-bar-btn');
    this.btnUpdateLib.classList.add('icon-desktop-download');
    this.element.appendChild(this.btnUpdateLib);

    this.btnPortSelect = document.createElement('button');
    this.btnPortSelect.classList.add('btn');
    this.btnPortSelect.classList.add('tool-bar-btn');
    this.btnPortSelect.classList.add('icon-plug');
    this.btnPortSelect.textContent = ' None';
    this.element.appendChild(this.btnPortSelect);

    this.btnBuildProject = document.createElement('button');
    this.btnBuildProject.classList.add('btn');
    this.btnBuildProject.classList.add('tool-bar-btn');
    this.btnBuildProject.classList.add('icon-triangle-right');
    this.element.appendChild(this.btnBuildProject);

    this.btnCleanProject = document.createElement('button');
    this.btnCleanProject.classList.add('btn');
    this.btnCleanProject.classList.add('tool-bar-btn');
    this.btnCleanProject.classList.add('icon-trashcan');
    this.element.appendChild(this.btnCleanProject);

    this.btnClose = document.createElement('button');
    this.btnClose.classList.add('btn');
    this.btnClose.classList.add('tool-bar-btn');
    this.btnClose.classList.add('icon-x');
    this.btnClose.classList.add('pull-right');
    this.element.appendChild(this.btnClose);

    this.panel = atom.workspace.addTopPanel({
      item: this.element,
      visible: false,
    });

    this.devSelectView = new DeviceSelectView(serializedState, this.btnDevSelect);

    this.btnNewProject.addEventListener('click', this);
    this.btnDevSelect.addEventListener('click', this);
    this.btnUpdateLib.addEventListener('click', this);
    this.btnClose.addEventListener('click', this);
  }

  handleEvent(event) {
    if (event.target == this.btnNewProject && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:createProject');
    } else if (event.target == this.btnDevSelect && event.type == 'click') {
      this.devSelectView.doShow();
    } else if (event.target == this.btnUpdateLib && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:updateSdk');
    } else if (event.target == this.btnClose && event.type == 'click') {
      atom.commands.dispatch(atom.views.getView(atom.workspace), 'nola-sdk:hideControlPanel');
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

  showDevSelectView() {
    console.log('showDevSelectView');
  }

  destroy() {
    this.element.remove();
  }
}
