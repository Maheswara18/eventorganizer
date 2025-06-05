import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { FormTemplate, FormTemplateResponse } from '../interfaces/form-template';

@Injectable({
  providedIn: 'root'
})
export class FormTemplateService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getFormTemplate(eventId: number): Observable<FormTemplateResponse> {
    return this.http.get<FormTemplateResponse>(`${this.apiUrl}/events/${eventId}/form-template`);
  }

  createFormTemplate(eventId: number, template: Partial<FormTemplate>): Observable<FormTemplateResponse> {
    return this.http.post<FormTemplateResponse>(`${this.apiUrl}/events/${eventId}/form-template`, template);
  }

  updateFormTemplate(eventId: number, templateId: number, template: Partial<FormTemplate>): Observable<FormTemplateResponse> {
    return this.http.put<FormTemplateResponse>(`${this.apiUrl}/events/${eventId}/form-template/${templateId}`, template);
  }

  deleteFormTemplate(eventId: number, templateId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/events/${eventId}/form-template/${templateId}`);
  }
} 