import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    FormsModule
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {


  usernameInput: string = '';
  passwordInput: string = '';


  @Output() loginEffettuato = new EventEmitter<any>();

  @Output() vaiRegistrazione = new EventEmitter<void>();



  effettuaLogin() {


    // 👑 CONTROLLO TITOLARE
    if (
      this.usernameInput === 'giovanniTitolare@salone.it' &&
      this.passwordInput === 'giovanni2026'
    ) {


      const titolare = {

        nome: 'Giovanni',
        email: 'giovanniTitolare@salone.it',
        ruolo: 'admin'

      };


      this.loginEffettuato.emit({

        tipo: 'titolare',
        utente: titolare

      });


      return;

    }



    // 👤 CONTROLLO CLIENTI

    // 👤 CONTROLLO CLIENTI DAL DATABASE REALE

    const database = localStorage.getItem('databaseUtentiBarber');

    const utenti = database ? JSON.parse(database) : [];


    const utenteTrovato = utenti.find((u: any) =>

      u.email === this.usernameInput &&
      u.password === this.passwordInput

    );







    if (utenteTrovato) {

      localStorage.setItem(
        'utenteAttivoBarber',
        JSON.stringify(utenteTrovato)
      );
      this.loginEffettuato.emit({

        tipo: 'cliente',
        utente: utenteTrovato

      });


    }
    else {


      alert('Email o Password errate ❌');


    }


  }


}
