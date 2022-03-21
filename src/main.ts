import {
  addCollectible,
  getCollectibleItemType,
  getPlayerCollectibleMap,
  getPlayers,
  getRandom,
  getRandomArrayElement,
  isQuestCollectible,
  ModCallbacksCustom,
  upgradeMod,
} from "isaacscript-common";

const MOD_NAME = "Amnesia";
const AMNESIA_COLLECTIBLE_TYPE = Isaac.GetItemIdByName("Amnesia");

const AMNESIA_CONFIG = {
  BASE_CHANCE: 0.25,
  STACKABLE: false,
  DO_LOG: true,
  IS_DEV: false,
};

const modState = {
  isMorphing: false,
};

export function main(): void {
  const modVanilla = RegisterMod(MOD_NAME, 1);
  const mod = upgradeMod(modVanilla);

  if (AMNESIA_CONFIG.IS_DEV)
    mod.AddCallbackCustom(ModCallbacksCustom.MC_POST_GAME_STARTED_REORDERED, postGameStartedReordered);

  mod.AddCallbackCustom(ModCallbacksCustom.MC_POST_COLLECTIBLE_INIT_FIRST, postCollectibleInitFirst);
}

function postGameStartedReordered() {
  for (const player of getPlayers()) {
    addCollectible(player, AMNESIA_COLLECTIBLE_TYPE);
    addCollectible(player, CollectibleType.COLLECTIBLE_SAUSAGE);
  }
}

function postCollectibleInitFirst(entityPickup: EntityPickup) {
  for (const player of getPlayers()) {
    if (checkCanMorph(player, entityPickup)) {
      modState.isMorphing = true;
      const newMorphItemId = pickItem(player);
      if (newMorphItemId !== CollectibleType.COLLECTIBLE_NULL)
        entityPickup.Morph(EntityType.ENTITY_PICKUP, PickupVariant.PICKUP_COLLECTIBLE, newMorphItemId, true);
      modState.isMorphing = false;
    }
  }
}

function checkCanMorph(player: EntityPlayer, entityPickup: EntityPickup): Boolean {
  return (
    !modState.isMorphing && player.HasCollectible(AMNESIA_COLLECTIBLE_TYPE) && !isQuestCollectible(entityPickup.SubType)
  );
}

function pickItem(player: EntityPlayer): int {
  const rngNum = getRandom();
  const allHeldItemsMap = getPlayerCollectibleMap(player);
  const amnesiaCount = AMNESIA_CONFIG.STACKABLE ? allHeldItemsMap.get(AMNESIA_COLLECTIBLE_TYPE)! : 1;
  const actualChance = 1 - (1 - AMNESIA_CONFIG.BASE_CHANCE) ** amnesiaCount;

  if (rngNum > actualChance) return CollectibleType.COLLECTIBLE_NULL;

  for (const key of allHeldItemsMap.keys()) {
    const itemType = getCollectibleItemType(key);
    if (itemType === ItemType.ITEM_ACTIVE || itemType === ItemType.ITEM_TRINKET) allHeldItemsMap.delete(key);
  }

  if (!AMNESIA_CONFIG.STACKABLE) allHeldItemsMap.delete(AMNESIA_COLLECTIBLE_TYPE);

  const uniqueHeldArray = [...allHeldItemsMap.keys()];

  if (uniqueHeldArray.length <= 0) return CollectibleType.COLLECTIBLE_NULL;

  return getRandomArrayElement(uniqueHeldArray);
}
