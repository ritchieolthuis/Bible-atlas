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

// In the order the events happen in Scripture: creation and the fall,
// through the patriarchs, the Exodus and conquest, the kingdom and exile,
// the life of Christ, and finally the future city of Revelation.
export const STRUCTURES_EN: Structure[] = [
  // eden_fall temporarily hidden: its .glb hangs indefinitely mid-load in
  // every tested browser (dev server and production build alike, no console
  // error) for a cause not yet isolated. Data/model untouched -  re-add this
  // line once the load hang is fixed and verified.
  // eden_fall,
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
