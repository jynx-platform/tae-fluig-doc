import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Wizard BPM',
  tagline: 'Wizard — Abertura de Processo BPM via Dataset',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'https://jynx-platform.github.io',
  baseUrl: '/tae-fluig-doc/',
  organizationName: 'jynx-platform',
  projectName: 'tae-fluig-doc',
  trailingSlash: false,

  onBrokenLinks: 'throw',

  i18n: {
    defaultLocale: 'pt-BR',
    locales: ['pt-BR'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    navbar: {
      title: 'Wizard BPM',
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'wizardSidebar',
          position: 'left',
          label: 'Wizard BPM',
        },
      ],
    },
    footer: {
      style: 'dark',
      copyright: `Copyright © ${new Date().getFullYear()} TOTVS — Wizard BPM`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['javascript', 'json', 'bash', 'markup'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
