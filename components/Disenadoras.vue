<template>
  <ul class="disList">
      <li
        v-for="disenadora in disenadoras"
        :key="disenadora.id"
      >
        <a class="disenadora" :href="disenadora.path">
          <div>
            <p class="autor">{{ disenadora.autor }}</p>
            <h2>{{ disenadora.nombre }}</h2>
          </div>

          <div class="especialidad">
            <p class="autor">{{ disenadora.especialidad }}</p>
            <Icon :especialidad="disenadora.especialidad" />
          </div>
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
      display: flex;
      justify-content: space-between;
      text-decoration: none;
      cursor: pointer;
      border-top: 1px solid #ccc;
      color: #aaa;
      transition: all .5s ease;
      .especialidad{
        display: flex;
        justify-content: center;
        align-items: center;
        align-self: end;
        p{
          padding: 0 1em;
        }
      }
      h2{
        margin: 0;
      }
      .autor{
        margin: 0;
        font-size: 0.8em;
      }

      &:hover{
        color: #333;

        background-color: #eee;
        #iconField{
          fill: #333;
        }
      }

  }


</style>


