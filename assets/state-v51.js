
window.PhantomState = (() => {
  const KEY = "phantom_case_master_state_v51";

  const defaults = {
    identityVerified:false,
    cooperationAccepted:false,

    darkKeys:{one:false,two:false,three:false},
    darkReported:false,
    ojisanFirstAppearance:false,
    houseUnlocked:false,

    squirrelAnswered:false,
    squirrelQrFound:false,
    squirrelReported:false,
    intrusionConcern:false,
    traceSearchUnlocked:false,

    traces:{one:false,two:false,three:false},
    endingUnlocked:false,
    endingComplete:false,

    chat:{
      phase:"start",
      declines:0,
      transcript:[]
    }
  };

  function cloneDefaults(){
    return JSON.parse(JSON.stringify(defaults));
  }

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return cloneDefaults();
      const parsed = JSON.parse(raw);
      const base = cloneDefaults();
      return {
        ...base,
        ...parsed,
        darkKeys:{...base.darkKeys,...(parsed.darkKeys||{})},
        traces:{...base.traces,...(parsed.traces||{})},
        chat:{...base.chat,...(parsed.chat||{})}
      };
    }catch(e){
      return cloneDefaults();
    }
  }

  function save(state){
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  function update(mutator){
    const state = load();
    mutator(state);
    save(state);
    return state;
  }

  function reset(){
    localStorage.removeItem(KEY);
    return cloneDefaults();
  }

  return {KEY,load,save,update,reset};
})();
