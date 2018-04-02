const model = require('./model');
const {models} = require('./model');
const Sequelize = require('sequelize');
const {log, biglog, errorlog, colorize} = require('./out'); 


exports.helpCmd = (socket, rl) => {

	  log(socket, 'Comandos');
      log(socket, 'h|help - Muestra esta ayuda.');
      log(socket, 'list - Listar los quizzes existentes.');
      log(socket, 'show <id> - Muestra la pregunta y la respuesta del quiz indicado.');
      log(socket, 'add -  Añadir un nuevo quiz interactivamente.');
      log(socket, 'delete <id> - Borrar el quiz indicado.');
      log(socket, 'edit <id> - Editar el quiz indicado.');
      log(socket, 'test <id> - Probar el quiz indicado.');
      log(socket, 'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
      log(socket, 'credits - Créditos.');
      log(socket, 'q|quit - Salir del programa.');
      rl.prompt();
};

exports.ListCmd = (socket, rl) => {
 models.quiz.findAll()
    .then (quizzes => {

        quizzes.forEach(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        });

    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });

};

const validateId = id => {

    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id);
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parametro <id> no es un número.`));
                } else {
                    resolve(id);
                }
            }
    });
};


exports.quitCmd = (socket, rl) =>{
	rl.close();
    socket.end();
};

exports.showCmd = (socket, rl, id) => {

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}.`);
        } log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

const makeQuestion = (socket, rl, text) => {

    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        });
    });
};

exports.addCmd = (socket, rl) => {
	
    makeQuestion(socket, rl, "Introduzca la pregunta: ")
    .then(q => {
        return makeQuestion(socket, rl, 'Introduzca la respuesta ')
        .then(a => {
            return {question: q, answer: a};
        });
    })
    .then(quiz => {
        return models.quiz.create(quiz);
    })
    .then((quiz) => {
        log(socket, `${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })

    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};


exports.editCmd = (socket, rl, id) => {

    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe un quiz asociado al id=${id}`);
        }

        process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
        return makeQuestion(socket, rl, 'Introduzca la pregunta: ')
        .then(q => {
            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
            return makeQuestion(socket, rl, 'Introduzca la respuesta ')
            .then(a => {
                quiz.question= q;
                quiz.answer= a;
                return quiz;
            });

         });
    })
    .then(quiz => {
        return quiz.save();
    })
    .then(quiz => {
        log(socket, `Se ha cambiado el quiz ${colorize(quiz.id), 'magenta'} por : ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });
};

exports.deleteCmd = (socket, rl,id) => {
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(socket, error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autores de la práctica:', 'green');
    log(socket, 'NICOLAS LOPEZ', 'green');
    rl.prompt();
};


exports.playCmd = (socket, rl) => {

    let score = 0;
    let toBeResolved = [];
    

    const playOne = () =>{

        return Promise.resolve()
        .then(() => {

            if (toBeResolved.length === 0) {

                log(socket, `No hay nada más que preguntar.`);
                log(socket, `Fin del examen. Aciertos:  `);
                log(socket, score, 'magenta');
                return;

            } else {

            let id = Math.floor(Math.random() * toBeResolved.length);

            let quiz = toBeResolved[id];
            toBeResolved.splice(id, 1);

            makeQuestion(socket, rl, `${quiz.question.concat('? ')}`)
            .then(answer =>{
            if(answer.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                score ++;
                log(socket, `CORRECTO - Lleva ${score} aciertos`);
                return playOne();
            } else {
                log(socket, "Incorrecto");
                log(socket, 'Fin del examen. Aciertos: ');
                biglog(socket, `${score}`, 'magenta');
                    }
                })
            }
            })
         
        }

        models.quiz.findAll({raw: true})
        .then(quizzes => {
            toBeResolved = quizzes;
        })
        .then(() => {
            return playOne();
        })
        .catch(error => {
        errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

exports.testCmd = (socket, rl, id) => {
	
    validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
        if (!quiz) {
            throw new Error(`No existe quiz asociado al id=${id}`);
        }

        return makeQuestion(socket, rl, `${quiz.question.concat('? ')}`)
        .then(a =>{
            if(a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
                log(socket, "Su respuesta es: ");
                log(socket, "Correcta");
            } else {
                log(socket, "Su respuesta es: ");
                log(socket, "Incorrecta");
            }
            //return quiz;

        });
    })
    .catch(Sequelize.ValidationError, error => {
        errorlog(socket, 'El quiz es erroneo:');
        error.errors.forEach(({message}) => errorlog(socket, message));
    })
    .catch(error => {
        errorlog(socket, error.message);
    })
    .then(() => {
        rl.prompt();
    });

};
