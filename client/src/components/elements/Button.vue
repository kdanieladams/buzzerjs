<template>
  <template v-if="!icon">
    <button class="btn" :id="id"
      :style="{backgroundColor: color}" 
      @click="$emit('btn-click')"
    >
      {{ text }}
    </button>
  </template>

  <template v-if="icon && icon_before">
    <button class="btn" :id="id"
      :style="{backgroundColor: color}" 
      @click="$emit('btn-click')"
    >
      <i :class="'fas ' + icon"></i>
      {{ text }}
    </button>
  </template>

  <template v-if="icon && !icon_before">
    <button class="btn" :id="id"
      :style="{backgroundColor: color}" 
      @click="$emit('btn-click')"
    >
      {{ text }}
      <i :class="'fas ' + icon"></i>
    </button>
  </template>
</template>

<script>
export default {
  name: 'Button',
  props: {
    id: String,
    text: String,
    color: String,
    icon: String,
    icon_before: Boolean
  },
  emits: [ 'btn-click' ]
}
</script>
