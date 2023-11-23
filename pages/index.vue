<template>
  <div>
    <header>
      <h1>Diseñadoras</h1>
      <p class="intro">
        Diseñadoras es un proyecto llevado a cabo en la e/s/d Madrid con el objetivo de recopilar a las grandes diseñadoras de la historia. Desde la colaboración de las asignatura Historia y Gráfica Interactiva, se ha propuesto a los alumnos de 2º curso del Grado de Diseño (especialidad de Gráfico) investigar sobre una diseñadora, para luego hablar de ella en una web que permita al visitante descubrirla y conocer su obra.
      </p>
    </header>
    <Disenadoras />
  </div>
</template>

<script>
export default {
  name: 'IndexPage'
}
</script>

<style>
  *{
    font-family: 'Lora', serif;
  }
  html, body{
    margin: 0;
  }
  header{
    position: sticky;
    top: 0;
    padding: 1em;
    background-color: white;
  }
  header h1{
    margin: 0;
  }
  header .intro{
    max-width: 800px;
    width: 80vw;
  }

</style>
