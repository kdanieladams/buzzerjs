<template>
  <template v-if="!icon">
    <button class="btn" :id="id" @click="$emit('btn-click')">
      {{ text }}
    </button>
  </template>

  <template v-if="icon && icon_before">
    <button class="btn" :id="id" @click="$emit('btn-click')">
      <i :class="'fas ' + icon"></i>
      {{ text }}
    </button>
  </template>

  <template v-if="icon && !icon_before">
    <button class="btn" :id="id" @click="$emit('btn-click')">
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
  data() {
    return {
      btnColor: this.color || '#555'
    };
  },
  mounted() {
    this.$watch('color', (colorVal) => {
      this.btnColor = colorVal;
    });
  },
  emits: [ 'btn-click' ]
}
</script>

<style scoped>
button.btn {
  background-color: v-bind(btnColor);
}
button.btn:hover {
  filter: brightness(150%);
}
button.btn:active {
  box-shadow: rgba(0, 0, 0, 0.5) 0px 2px 10px 0px inset;
  filter: brightness(85%);
}
</style>