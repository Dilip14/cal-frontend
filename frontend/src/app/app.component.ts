import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// Interface matching your Spring Boot 'CalculationResponse'
interface CalculationResponse {
  result?: number;
  error?: string;
  // Note: Adjust property names if your Java model uses a different key for messages
}

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  displayValue: string = '';
  
  private num1: number | null = null;
  private operator: string | null = null;
  private isReadyForNextNumber: boolean = false;

  private http = inject(HttpClient);

  // Appends a digit or decimal point to the active view state
  append(value: string): void {
    if (this.isReadyForNextNumber) {
      this.displayValue = value;
      this.isReadyForNextNumber = false;
    } else {
      // Prevent multiple decimals in a single number sequence
      if (value === '.' && this.displayValue.includes('.')) return;
      this.displayValue = this.displayValue === '0' && value !== '.' ? value : this.displayValue + value;
    }
  }

  // Captures the chosen operation type (+, -, *, /)
  setOperator(op: string): void {
    if (this.displayValue === '' || this.displayValue === 'Error') return;
    
    this.num1 = parseFloat(this.displayValue);
    this.operator = op;
    this.isReadyForNextNumber = true;
  }

  clear(): void {
    this.displayValue = '';
    this.num1 = null;
    this.operator = null;
    this.isReadyForNextNumber = false;
  }

  delete(): void {
    if (!this.isReadyForNextNumber) {
      this.displayValue = this.displayValue.slice(0, -1);
    }
  }

  // Packages state data and submits payload to Spring Boot Controller
  calculate(): void {
    if (this.num1 === null || !this.operator || !this.displayValue) return;

    const num2 = parseFloat(this.displayValue);

    // Matches your 'CalculationRequest' Java model properties exactly
    const requestPayload = {
      num1: this.num1,
      num2: num2,
      operator: this.operator
    };

    this.http.post<any>('http://localhost:8080/api/calculate', requestPayload)
      .subscribe({
        next: (response) => {
          // Handles cases where backend returns errors (like divide by zero)
          if (response.error || typeof response.result !== 'number') {
            this.displayValue = response.error || response.result || 'Error';
          } else {
            this.displayValue = response.result.toString();
          }
          
          // Reset states following a finished operation sequence
          this.num1 = null;
          this.operator = null;
          this.isReadyForNextNumber = true;
        },
        error: (error) => {
          console.error('Spring Boot API call error:', error);
          this.displayValue = 'Error';
        }
      });
  }
}
