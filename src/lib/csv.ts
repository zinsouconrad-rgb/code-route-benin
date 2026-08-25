/** Analyse CSV minimaliste (séparateur , ou ; , guillemets doubles échappés). */
export function parseCsv(texte: string): string[][] {
  const contenu = texte.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const separateur = detecterSeparateur(contenu);
  const lignes: string[][] = [];
  let champ = "";
  let ligne: string[] = [];
  let dansGuillemets = false;

  for (let i = 0; i < contenu.length; i++) {
    const c = contenu[i]!;
    if (dansGuillemets) {
      if (c === '"') {
        if (contenu[i + 1] === '"') {
          champ += '"';
          i++;
        } else dansGuillemets = false;
      } else champ += c;
      continue;
    }
    if (c === '"') dansGuillemets = true;
    else if (c === separateur) {
      ligne.push(champ.trim());
      champ = "";
    } else if (c === "\n") {
      ligne.push(champ.trim());
      lignes.push(ligne);
      ligne = [];
      champ = "";
    } else champ += c;
  }
  ligne.push(champ.trim());
  lignes.push(ligne);

  return lignes.filter((l) => l.some((v) => v !== ""));
}

function detecterSeparateur(contenu: string): string {
  const premiere = contenu.split("\n")[0] ?? "";
  const pv = (premiere.match(/;/g) ?? []).length;
  const vg = (premiere.match(/,/g) ?? []).length;
  return pv >= vg ? ";" : ",";
}

export type LigneImport = Record<string, string>;

export function lignesEnObjets(lignes: string[][]): LigneImport[] {
  if (lignes.length === 0) return [];
  const entetes = (lignes[0] ?? []).map((e) =>
    e
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, "_"),
  );
  return lignes.slice(1).map((l) => {
    const o: LigneImport = {};
    entetes.forEach((e, i) => (o[e] = l[i] ?? ""));
    return o;
  });
}

export const MODELE_CSV = [
  "theme;enonce;type;difficulte;explication;source;reponse_1;reponse_2;reponse_3;reponse_4;correctes",
  "Signalisation;Que signifie un panneau triangulaire à bord rouge ?;choix_unique;facile;Explication saisie par l'auto-école;Manuel interne;Danger;Interdiction;Obligation;Fin d'interdiction;1",
  "Priorités;Qui passe en premier à une intersection sans signalisation ?;choix_unique;moyen;;;Le véhicule venant de droite;Le véhicule le plus rapide;Le plus gros véhicule;Le premier arrivé;1",
].join("\n");
