"use strict";
// module.exports = function(sequelize, DataTypes) {
//   var User = sequelize.define("User", {
//     email: DataTypes.STRING,
//     passwordDigest: DataTypes.STRING
//   }, {
//     classMethods: {
//       associate: function(models) {
//         // associations can be defined here
//       }
//     }
//   });
//   return User;
// };

var bcrypt = require('bcrypt');
var salt = bcrypt.genSaltSync(10);

module.exports = function (sequelize, DataTypes){

  // Defining a sequelize model
  var User = sequelize.define('User', {

    // ATRIBUTES BEGIN

    // email attribute
    email: { 
      type: DataTypes.STRING, 
      unique: true, 
      validate: {

        // check length on create
        len: [6, 30],
      }
    },

    // attribute
    passwordDigest: {
      type:DataTypes.STRING,
      validate: {

        // should not be empty
        notEmpty: true
      }
    }
  },

  // ATTRIBUTES END

  { // these belong to a particular user instance
    // eg bill.checkPassword("foo"), jane.checkPassword("bar")
    instanceMethods: {
      checkPassword: function(password) {
        return bcrypt.compareSync(password, this.passwordDigest);
      }
    },

    // these belong on the User constructor, eg, db.User.encryptPassword
    // or db.User.createSecure("blah@blah.com", "blahblah");
    classMethods: {
      encryptPassword: function(password) {
        var hash = bcrypt.hashSync(password, salt);
        return hash;
      },

      // Start here to securely create a user
      // email, password: attributes
      // err, success: callbacks

      createSecure: function(email, password, err, success) {

        // check the password length
        if (password.length < 6) {
          err( {message: "Password should be more than six characters"} );
        } else {

          // call create on User
          this.create({
            email: email,

            // adds salt, returns hash, because we don't want to save raw p/w
            passwordDigest: this.encryptPassword(password)

          // Alternatively:
          // return this.create({
          //   email: email;
          //   passwordDigest: this.encryptPassword(password)
          // });

          }).error( function(error) {
            console.log(error);

            if (error.email) {
              err( {message: 'Your username should be at least 6 characters long', email: email} );
            } else {
              err( {message: 'An account with that username already exists', email: email} );
            }

          }).success( function(user) {

            // Alternatively, success(user);
            success( {message: 'Account created, please log in now'} );
          });
        }
      },

      // Alternatively:
      // createSecure: function(email, password) {
      //   if(password.length < 6) {
      //     throw new Error("Password too short");
      //   }
      //   return this.create({
      //     email: email,
      //     passwordDigest: this.encryptPassword(password)
      //   });
      // }

      authenticate: function(email, password, err, success) {

        // find a user in the DB
        this.find({
          where: {
            email: email
          }
        })

        // Alternatively:
        // return this.find({
        //   where: {
        //     ...
        //   }
        // });

        // when that's done, 
        .done( function(error,user) {

          if (error) {
            console.log(error);
            err( {message: "Oops! Something went wrong"} );
          } else if (user === null) {
            err( {message: "Username does not exist"} );
          } else if ((User.comparePass(password, user.passwordDigest)) === true) {
            success(user);
          } else {
            err( {message: "Invalid password"} );
          }

        });
      }

      // Alternatively:
      // authenticate: function(email, password) {
      //   // find a user in the DB
      //   return this.find({
      //     where: {
      //       email: email
      //     }
      //   }) 
      //   .then(function(user){
      //     if (user === null){
      //       throw new Error("Username does not exist");
      //     }
      //     else if ((User.comparePass(password, user.passwordDigest)) === true){
      //       return user;
      //     }

      //   });
      // }   

    } // close classMethods
  }); // close define user
  return User;
}; // close User function