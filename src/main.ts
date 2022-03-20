import {
  getCollectibleItemType,
  getPlayerCollectibleMap,
  getPlayers,
  getRandom,
  getRandomArrayElement,
  isCollectiblePreviouslySeen,
  isQuestCollectible,
  upgradeMod,
} from "isaacscript-common";

const MOD_NAME = "Amnesia";
const AMNESIA_COLLECTIBLE_TYPE = Isaac.GetItemIdByName("Amnesia");

const AMNESIA_CONFIG = {
  BASE_CHANCE: 0.25,
  STACKABLE: false,
};

const modState = {
  isMorphing: false,
};

export function main(): void {
  const modVanilla = RegisterMod(MOD_NAME, 1);
  const mod = upgradeMod(modVanilla);

  mod.AddCallback(ModCallbacks.MC_POST_PICKUP_INIT, postPickupInit);
}

function postPickupInit(entityPickup: EntityPickup) {
  for (const player of getPlayers()) {
    if (checkCanMorph(player, entityPickup)) {
      modState.isMorphing = true;
      const newMorphItemId = pickItem(player, entityPickup.SubType);
      entityPickup.Morph(EntityType.ENTITY_PICKUP, PickupVariant.PICKUP_COLLECTIBLE, newMorphItemId);
      modState.isMorphing = false;
    }
  }
}

function checkCanMorph(player: EntityPlayer, entityPickup: EntityPickup): Boolean {
  return (
    !modState.isMorphing &&
    player.HasCollectible(AMNESIA_COLLECTIBLE_TYPE) &&
    entityPickup.Variant == PickupVariant.PICKUP_COLLECTIBLE &&
    !isQuestCollectible(entityPickup.SubType) &&
    !isCollectiblePreviouslySeen(entityPickup)
  );
}

function pickItem(player: EntityPlayer, oldSubType: int): int {
  const rngNum = getRandom();
  const allHeldItemsMap = getPlayerCollectibleMap(player);
  const amnesiaCount = AMNESIA_CONFIG.STACKABLE ? allHeldItemsMap.get(AMNESIA_COLLECTIBLE_TYPE)! : 1;
  const actualChance = 1 - (1 - AMNESIA_CONFIG.BASE_CHANCE) ** amnesiaCount;

  if (rngNum > actualChance) return oldSubType;

  for (const key of allHeldItemsMap.keys()) {
    const itemType = getCollectibleItemType(key);
    if (itemType === ItemType.ITEM_ACTIVE || itemType === ItemType.ITEM_TRINKET) allHeldItemsMap.delete(key);
  }

  if (!AMNESIA_CONFIG.STACKABLE) allHeldItemsMap.delete(AMNESIA_COLLECTIBLE_TYPE);

  const uniqueHeldArray = [...allHeldItemsMap.keys()];

  if (uniqueHeldArray.length <= 0) return oldSubType;

  return getRandomArrayElement(uniqueHeldArray);
}
