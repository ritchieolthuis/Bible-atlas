import type { Structure } from "@/types/structure";
import { solomon_temple } from "./solomon_temple";
import { tabernacle } from "./tabernacle";
import { noahs_ark } from "./noahs_ark";
import { tower_babel } from "./tower_babel";
import { walls_jericho } from "./walls_jericho";
import { herods_temple } from "./herods_temple";
import { new_jerusalem } from "./new_jerusalem";
import { ezekiel_temple } from "./ezekiel_temple";
import { eden_fall } from "./eden_fall";
import { mount_of_olives } from "./mount_of_olives";
import { golgotha } from "./golgotha";

// In de volgorde waarin de gebeurtenissen in de Schrift plaatsvinden: de
// schepping en de zondeval, via de aartsvaders, de uittocht en de intocht,
// het koninkrijk en de ballingschap, het leven van Christus, en tot slot de
// toekomstige stad uit Openbaring.
export const STRUCTURES_NL: Structure[] = [
  eden_fall,
  noahs_ark,
  tower_babel,
  tabernacle,
  walls_jericho,
  solomon_temple,
  ezekiel_temple,
  herods_temple,
  mount_of_olives,
  golgotha,
  new_jerusalem,
];
