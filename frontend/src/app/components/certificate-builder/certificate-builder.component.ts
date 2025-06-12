import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, moveItemInArray, CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';

interface CertificateElement {
  id: string;
  type: 'text' | 'image' | 'qr';
  content: string;
  style: {
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    alignment?: 'left' | 'center' | 'right';
  };
}

@Component({
  selector: 'app-certificate-builder',
  templateUrl: './certificate-builder.component.html',
  styleUrls: ['./certificate-builder.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, CdkDrag, CdkDropList]
})
export class CertificateBuilderComponent implements OnInit {
  @Input() templateId?: number;
  @Output() saveTemplate = new EventEmitter<any>();

  elements: CertificateElement[] = [];
  selectedElement: CertificateElement | null = null;
  availableElements = [
    { type: 'text', label: 'Teks' },
    { type: 'image', label: 'Gambar' },
    { type: 'qr', label: 'Kode QR' }
  ];

  constructor() {}

  ngOnInit() {
    if (this.templateId) {
      this.loadTemplate();
    }
  }

  private loadTemplate() {
    // TODO: Load template from service
  }

  onDrop(event: CdkDragDrop<CertificateElement[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(this.elements, event.previousIndex, event.currentIndex);
    } else {
      // Add new element
      const newElement: CertificateElement = {
        id: `element-${Date.now()}`,
        type: event.item.data.type,
        content: '',
        style: {
          x: event.distance.x,
          y: event.distance.y,
          width: 100,
          height: 100,
          fontSize: 16,
          fontFamily: 'Arial',
          color: '#000000',
          alignment: 'left'
        }
      };
      this.elements.push(newElement);
    }
  }

  onElementSelect(element: CertificateElement) {
    this.selectedElement = element;
  }

  updateElement(element: CertificateElement) {
    const index = this.elements.findIndex(e => e.id === element.id);
    if (index !== -1) {
      this.elements[index] = { ...element };
    }
  }

  onSave() {
    this.saveTemplate.emit({
      elements: this.elements
    });
  }

  deleteElement(elementId: string) {
    this.elements = this.elements.filter(e => e.id !== elementId);
    if (this.selectedElement?.id === elementId) {
      this.selectedElement = null;
    }
  }
} 