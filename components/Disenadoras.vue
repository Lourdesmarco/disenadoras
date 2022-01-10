<template>
  <ul class="disList">
      <li
        v-for="disenadora in disenadoras"
        :key="disenadora.id"
      >
        <a class="disenadora" :href="disenadora.path">
          <p class="autor">{{ disenadora.autor }}</p>
          <h2>{{ disenadora.nombre }}</h2>
        </a>
      </li>
  </ul>
</template>

<script>
export default {
  name: 'Disenadoras',
  computed: {
    disenadoras () {
      return this.$store.state.disenadoras
    }
  }
}
</script>

<style lang="postcss" scoped>
  .disList{
    list-style-type: none;
    margin: 0;
    padding: 0;

  }
  .disenadora{
      padding: 1em;
      display: block;
      text-decoration: none;
      cursor: pointer;
      border-top: 1px solid #ccc;
      color: #aaa;
      transition: all .5s ease;
  }
  .disenadora h2{
    margin: 0;
  }
  .disenadora .autor{
    margin: 0;
    font-size: 0.8em;

  }
  .disenadora:hover{
    color: #333;
    background-color: #eee;
  }

</style>


