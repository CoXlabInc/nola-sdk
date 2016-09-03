'use babel';

import NolaSdkView from './nola-sdk-view';
import { CompositeDisposable } from 'atom';

export default {

  nolaSdkView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.nolaSdkView = new NolaSdkView(state.nolaSdkViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.nolaSdkView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'nola-sdk:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.nolaSdkView.destroy();
  },

  serialize() {
    return {
      nolaSdkViewState: this.nolaSdkView.serialize()
    };
  },

  toggle() {
    console.log('NolaSdk was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
