import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private storageReady = false;

  constructor(
    private http: HttpClient,
    private storage: Storage
  ) {
    this.initStorage();
  }

  async initStorage() {
    await this.storage.create();
    this.storageReady = true;
  }

  async logout(): Promise<void> {
    if (!this.storageReady) {
      await this.initStorage();
    }
    // Hapus token atau data user dari storage
    await this.storage.remove('token');
    // Bisa juga clear semua storage jika perlu:
    // await this.storage.clear();
  }

  // Contoh fungsi login yang simpan token
  async login(credentials: any) {
    const response = await this.http.post<any>('http://localhost:8000/api/login', credentials).toPromise();
    if (response && response.token) {
      if (!this.storageReady) {
        await this.initStorage();
      }
      await this.storage.set('token', response.token);
    }
    return response;
  }
}
