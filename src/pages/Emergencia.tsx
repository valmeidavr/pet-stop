import { PetMap } from "../components/PetMap";

export function Emergencia() {
  return (
    <main className="page page--flush page--pet-map">
      <PetMap emergencyMode />
    </main>
  );
}
