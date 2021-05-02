module.exports = {
  
  SIGNED_COOKIE_SECRET : 'F5N3_eCk2?g$VLt5%*8&A2`4uu=/Em^S',  
  API_KEYS : ['0e47ce05-5648-4315-b247-78af99377fa1', ''], 

  POSTGRES : {
      host : 'localhost',
      user : 'luffydev',
      password: '',
      database: 'maxime',
      port: 5432,
  },

  WHATSAPP : {
    url : 'https://webservice.checkwa.com/',
    user : 'kwizfreak',
    key : '812cd6-48cce5-62f887-7bf286-01e9c4'
  },

  REDIS : {
    host : 'localhost',
    port : 6379,
    password : ""
  },

  SESSION : {
    // Two day in milliseconds 
    expire : 172800000,
    encrypt_key : 'WaPmQ3xcWZP05v6IDFllUFYzm9giLOdN',

    // do not change this ! 
    password_salt : 'EUcz2ylEhc77x1zbfVoA6FoVFwhz6PbB'
  }

};