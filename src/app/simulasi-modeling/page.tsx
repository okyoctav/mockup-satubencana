import { Metadata } from 'next';
import SimulasiModelingView from '@/components/simulasi/SimulasiModelingView';

export const metadata: Metadata = {
  title: 'Simulasi Modeling Banjir 2D (FastFlood) | SatuBencana',
  description:
    'Modul simulasi hidrodinamika banjir 2D cepat (FastFlood engine) dengan parameter presipitasi, runoff, pasang rob, tanggul, dan analisis dampak risiko.',
};

export default function SimulasiModelingPage() {
  return <SimulasiModelingView />;
}
