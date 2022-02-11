try {
  importScripts('../assets/lib/moment.min.js', '../config.js', 'background.js')

} catch (e) {

  if(typeof(e) == "object"){
    console.log(e);
  }

}