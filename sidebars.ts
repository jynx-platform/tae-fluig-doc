import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  wizardSidebar: [
    {
      type: 'category',
      label: 'Wizard — Abertura BPM via Dataset',
      items: [
        'wizard-bpm/introducao',
        'wizard-bpm/passo-1-card-data',
        'wizard-bpm/passo-2-chamar-dataset',
        'wizard-bpm/passo-3-processar-resposta',
        'wizard-bpm/passo-4-acompanhar-grid',
        'wizard-bpm/referencia-campos',
        'wizard-bpm/exemplos-completos',
        'wizard-bpm/troubleshooting',
      ],
    },
  ],
};

export default sidebars;
