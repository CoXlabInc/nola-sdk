'use babel';

export default class ControlPanelView {
  devSelectView: null;
  portSeletView: null;
  panel: null;

  constructor(serializedState) {
    // Create root element
    this.element = document.createElement('div');
    this.element.classList.add('nola-sdk');
    this.element.classList.add('nola-sdk-tool-bar');

    const btnPortSelect = document.createElement('button');
    btnPortSelect.classList.add('pull-right');
    btnPortSelect.classList.add('btn');
    btnPortSelect.classList.add('icon');
    btnPortSelect.classList.add('icon-plug');
    btnPortSelect.textContent = 'JTAG';

    this.element.appendChild(btnPortSelect);

    this.panel = atom.workspace.addTopPanel({
      item: this.element,
      visible: false,
    });
  }

  doShow() {
    if (this.panel.isVisible() == false) {
      this.panel.show();
    }
  }
}
