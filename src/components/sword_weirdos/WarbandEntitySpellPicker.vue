<script setup lang="ts">

const chosenSpells = defineModel<string[]>()
import { useSwordWeirdosRepo } from "@/stores/swordWeirdosRepo"
let swordRepo = useSwordWeirdosRepo()

const { maxSpellCost = 0, modifier = [] } = defineProps<{
    maxSpellCost?: number
    modifier?: string[]
}>()

const search = ref("")
const searchField = ref()
function focusSearch() {
    searchField.value?.$el.querySelector("input")?.focus()
}
const filteredSpells = computed(() => {
    const term = search.value?.trim().toLowerCase() ?? ""
    return term ? swordRepo.spells.filter(s => s.name.toLowerCase().includes(term)) : swordRepo.spells
})

function getAllSpellsAsString() {
    var allSpells = [...modifier]
    if (chosenSpells.value != undefined) {
        allSpells = [...allSpells, ...chosenSpells.value]
    }
    return allSpells.map((spellID) => swordRepo.getSpellWithID(spellID).name).join(", ")
}
function selectSpell(spell) {
    if (!modifier.includes(spell.id)) {
        if (!chosenSpells.value?.includes(spell.id)) {
            chosenSpells.value?.push(spell.id)
        }
        else {
            var index = chosenSpells.value.indexOf(spell.id);
            if (index !== -1) {
                chosenSpells.value.splice(index, 1);
            }
        }
    }
}
</script>

<template>
    <div v-if="maxSpellCost > 0 || modifier?.length > 0">
    <v-text-field v-if="maxSpellCost==0" class="cursor-pointer" color="primary" :readonly="true" label="spells"
                variant="underlined" :model-value="getAllSpellsAsString()" multiple></v-text-field>
    <v-dialog v-if="maxSpellCost!=0" max-width="500" @after-enter="focusSearch" @after-leave="search = ''">
        <template v-slot:activator="{ props: activatorProps }">
            <v-text-field  class="cursor-pointer" color="primary" :readonly="true" @click="" v-bind="activatorProps" label="spells"
                variant="underlined" :model-value="getAllSpellsAsString()" multiple></v-text-field>

        </template>

        <template v-slot:default="{ isActive }">
              <v-card>
                 <div class="d-flex align-center">
                    <v-btn icon="mdi-arrow-left" @click="isActive.value = false" ></v-btn>
                    <v-text-field v-model="search" placeholder="Search..." prepend-inner-icon="mdi-magnify"
                        density="compact" variant="plain" hide-details clearable class="mx-2" ref="searchField"></v-text-field>
                 </div>
                 <v-divider></v-divider>
                <v-container class="scrollable">
                    <v-row v-for="spell in filteredSpells">
                        <v-col v-if="spell.pts <= maxSpellCost">
                            <v-card @click="selectSpell(spell)"
                                :color="chosenSpells?.includes(spell.id) ? 'primary' : ''" width="auto"
                                :title="spell.name + ' (' + spell.pts + ')'">
                                <v-card-text>
                                    {{ spell.effect }}
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                    
                </v-container>
            </v-card>
        </template>
    </v-dialog>
</div>
</template>

<style>
.scrollable {
    overflow-y: scroll;
}
</style>