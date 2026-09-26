<script setup lang="ts">

const chosenClasses = defineModel<string[]>()
import { useSwordWeirdosRepo } from "@/stores/swordWeirdosRepo"
let swordRepo = useSwordWeirdosRepo()

const { maxNumberOfClasses = 1, classesWhichMayNotBeSelected = [] } = defineProps<{
    maxNumberOfClasses?: number
    classesWhichMayNotBeSelected?: string[]
}>()

const search = ref("")
const searchField = ref()
function focusSearch() {
    searchField.value?.$el.querySelector("input")?.focus()
}
const filteredClasses = computed(() => {
    const term = search.value?.trim().toLowerCase() ?? ""
    return term ? swordRepo.classes.filter(c => c.name.toLowerCase().includes(term)) : swordRepo.classes
})

function selectClass(myClass) {
    if (!chosenClasses.value?.includes(myClass.id)) {

        if (!classesWhichMayNotBeSelected.includes(myClass.id)) {
            if (chosenClasses.value?.length < maxNumberOfClasses) {
                chosenClasses.value?.push(myClass.id)
            }
        }
    }
    else {
        var index = chosenClasses.value.indexOf(myClass.id);
        if (index !== -1) {
            chosenClasses.value.splice(index, 1);
        }
    }

}


</script>

<template>
    <v-dialog max-width="500" @after-enter="focusSearch" @after-leave="search = ''">
        <template v-slot:activator="{ props: activatorProps }">
            <v-text-field class="cursor-pointer" color="primary" :readonly="true" @click="" v-bind="activatorProps"
                label="class" variant="underlined" item-title="name" item-value="name" item-children="effect"
                v-model="chosenClasses" multiple></v-text-field>

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
                    <v-row v-for="myClass in filteredClasses">
                        <v-col>
                            <v-card @click="selectClass(myClass)" density="compact" 
                                :color="chosenClasses?.includes(myClass.id) ? 'primary' : ''" width="auto"
                                :title="myClass.name + ' (' + myClass.pts + ')'" :variant="classesWhichMayNotBeSelected.some(c=>c==myClass.id)?'plain':undefined">
                                <v-card-text>
                                    {{ myClass.effect }}
                                </v-card-text>
                            </v-card>
                        </v-col>
                    </v-row>
                 
                </v-container>
            </v-card>
        </template>
    </v-dialog>

</template>
