<template>
  <svg v-if="especialidad == 'grafico'" id="iconField" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M200-120q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h560q33 0 56.5 23.5T840-760v560q0 33-23.5 56.5T760-120H200Zm0-80h560v-560H200v560Zm40-80h480L570-480 450-320l-90-120-120 160Zm-40 80v-560 560Z"/></svg>
  <svg v-else-if="especialidad == 'interiores'" id="iconField" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M800-80v-600q0-33-23.5-56.5T720-760h-40v52q0 12-8 20t-20 8H428q-14 0-22.5-15t-1.5-29l76-164q7-15 20.5-23.5T532-920h92q24 0 40 18t16 42v20h40q66 0 113 47t47 113v600h-80ZM508-760h92v-80h-56l-36 80ZM200-80q-51 0-85.5-34.5T80-200v-100q0-33 22-61.5t58-34.5v-84q0-33 23.5-56.5T240-560h320q33 0 56.5 23.5T640-480v84q36 6 58 33t22 63v100q0 51-34.5 85.5T600-80H200Zm40-400v100q18 15 29 35.5t11 44.5v20h240v-20q0-24 11-44.5t29-35.5v-100H240Zm-40 320h400q18 0 29-12.5t11-27.5v-100q0-9-5.5-14.5T620-320q-9 0-14.5 5.5T600-300v100H200v-100q0-9-5.5-14.5T180-320q-9 0-14.5 5.5T160-300v100q0 15 11 27.5t29 12.5Zm320-120H280h240ZM240-480h320-320Zm-40 320h400-400Z"/></svg>
  <svg v-else-if="especialidad == 'moda'" id="iconField" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M120-160q-17 0-28.5-11.5T80-200q0-10 4-18.5T96-232l344-258v-70q0-17 12-28.5t29-11.5q25 0 42-18t17-43q0-25-17.5-42T480-720q-25 0-42.5 17.5T420-660h-80q0-58 41-99t99-41q58 0 99 40.5t41 98.5q0 47-27.5 84T520-526v36l344 258q8 5 12 13.5t4 18.5q0 17-11.5 28.5T840-160H120Zm120-80h480L480-420 240-240Z"/></svg>
  <svg v-else="especialidad == 'producto'" id="iconField" xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 -960 960 960" width="24"><path d="M160-120v-80h640v80H160Zm160-160q-66 0-113-47t-47-113v-400h640q33 0 56.5 23.5T880-760v120q0 33-23.5 56.5T800-560h-80v120q0 66-47 113t-113 47H320Zm0-80h240q33 0 56.5-23.5T640-440v-320H240v320q0 33 23.5 56.5T320-360Zm400-280h80v-120h-80v120ZM320-360h-80 400-320Z"/></svg>
</template>

<script >
//const props = defineProps(['especialidad'])

//console.log(props.foo)
  export default {
    props: ['especialidad']
  }
</script>

<style lang="postcss" scoped>
  #iconField{
    fill: #aaa;
  }
</style>
