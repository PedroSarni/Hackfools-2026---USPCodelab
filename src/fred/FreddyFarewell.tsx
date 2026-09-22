import { MatteVideo } from './MatteVideo';

export function FreddyFarewell({ onFinished }: { onFinished(): void }): React.JSX.Element {
  return <div className="os-farewell" role="dialog" aria-modal="true" aria-label="Despedida do Freddy">
    <MatteVideo src="./fred/freddy_morto.mp4" green sideInset={0.19} muted={false} label="Freddy se despedindo" onEnded={onFinished} />
  </div>;
}
