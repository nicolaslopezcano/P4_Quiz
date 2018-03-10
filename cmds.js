const model = require('./model');
const {log, biglog, errorlog, colorize} = require('./out'); 


exports.helpCmd = rl => {

	  log('Comandos');
      log('h|help - Muestra esta ayuda.');
      log('list - Listar los quizzes existentes.');
      log('show <id> - Muestra la pregunta y la respuesta del quiz indicado.');
      log('add -  Añadir un nuevo quiz interactivamente.');
      log('delete <id> - Borrar el quiz indicado.');
      log('edit <id> - Editar el quiz indicado.');
      log('test <id> - Probar el quiz indicado.');
      log('p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
      log('credits - Créditos.');
      log('q|quit - Salir del programa.');
      rl.prompt();
};

exports.ListCmd = rl => {
	model.getAll().forEach((quiz, id) => {
    log(` [${colorize(id, 'magenta')}]:  ${quiz.question}`);
    });
	rl.prompt(); 
};

exports.quitCmd = rl =>{
	rl.close();
	rl.prompt();
};

exports.showCmd = (rl, id) => {
	if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            const quiz = model.getByIndex(id);
            log(` [${colorize(id, 'magenta')}]:  ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};



exports.addCmd = rl => {
	rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

        rl.question(colorize(' Introduzca la respuesta: ', 'red'), answer => {

            model.add(question, answer);
            log(` ${colorize('Se ha añadido', 'magenta')}: ${question} ${colorize('=>', 'magenta')} ${answer}`);
            rl.prompt();
        });
    });
};
exports.editCmd = (rl, id) => {
	if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {
            const quiz = model.getByIndex(id);

            process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)},0);

            rl.question(colorize(' Introduzca una pregunta: ', 'red'), question => {

                process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)},0);

                rl.question(colorize(' Introduzca la respuesta ', 'red'), answer => {
                    model.update(id, question, answer);
                    log(` Se ha cambiado el quiz ${colorize(id, 'magenta')} por: ${question} ${colorize('=>', 'magenta')} ${answer}`);
                    rl.prompt();
                });
            });
        } catch (error) {
            errorlog(error.message);
            rl.prompt();
        }
    }
};
exports.deleteCmd = (rl,id) => {
     if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
    } else {
        try {
            model.deleteByIndex(id);
        } catch(error) {
            errorlog(error.message);
        }
    }
    rl.prompt();
};

exports.creditsCmd = rl => {
    log('Autores de la práctica:', 'green');
    log('NICOLAS LOPEZ', 'green');
    rl.prompt();
};


exports.playCmd = rl => {

    let score = 0;
    let toBeResolved = [];
    let arrayl = model.getAll();

    for (let i = 0; i < arrayl.lenght; i++){

        toBeResolved.push(i);
    }

    const playOne = () =>{

        if (toBeResolved.lenght === 0) {

            log(`No hay nada más que preguntar.`);
            log(`Fin del examen. Aciertos:  `);
            biglog(score, 'magenta');
            rl.prompt;

        } else {

            let id = Math.floor(Math.random() * toBeResolved.length);

            let quiz = arrayl[id];
            let al = quiz.question;
            let bl = '? ';
            let kkk = al.concat(bl);

            rl.question(colorize(kkk, 'red'), respu => {
                let respuesta = respu.toLowerCase().trim();
                let answer2 = quiz.answer.toLowerCase().trim();

                    if (respuesta === answer2) {
                        score++;

                        log(`Correcto! - Lleva ${score} aciertos`);
                        toBeResolved.splice(id, 1);
                        arrayl.splice(id, 1);
                        playOne();

                    } else {
                        log('Incorrecta');
                        log('Fin del examen. Aciertos: ');
                        biglog(score, 'yellow');
                         rl.prompt();
                    }
                   
            })

        }
    }
    playOne();
};
	



exports.testCmd = (rl, id) => {
	
    if (typeof id === "undefined") {
        errorlog(`Falta el parámetro id.`);
        rl.prompt();
    } else {
        try {

            const quiz = model.getByIndex(id); 
            let a = quiz.question;
            let b = '? ';
            let kk = a.concat(b);

            rl.question(colorize(kk, 'red'), resp => {
                let respl = resp.toLowerCase().trim();
                let answerl = quiz.answer.toLowerCase().trim();

                    if (respl === answerl) {
                        log('Su  respuesta es: ');
                        log('Correcta');
                        biglog('Correcta', 'green');
                    } else {
                        log('Su  respuesta es: ');
                        log('Incorrecta');
                        biglog('Incorrecta', 'red');
                    }
                    rl.prompt();
            });

        } catch (error) {
            errorlog(error.message);
            rl.prompt();

    }

}




}
