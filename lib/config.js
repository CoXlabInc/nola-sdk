'use babel';

export default {
  orgKey: {
    title: 'Organization Key',
    description: 'Enter provided 8-byte hexadecimal key to use organization-specific devices. (e.g., 1A2B3C4D5E6F7A8B)',
    type: 'string',
    default: '',
    order: 1
  },

  hwLibDevMode: {
    title: 'Hardware Library Development Mode',
    description: 'Build hardware library source and link Nol.A project with it instead of downloaded binaries.',
    type: 'boolean',
    default: 'false',
    order: 2
  },

  hwLibSourcePath: {
    title: 'Hardware Library Source Path',
    description: 'Enter the path of the hardware library source for the hardware library development mode.',
    type: 'string',
    default: '',
    order:3
  },
};