import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../user.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-user-form',
  templateUrl: './user-form.component.html',
  styleUrls: ['./user-form.component.css'],
})
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  photoInvalid = false;
  isFileChanged: boolean = false;
  allowedFileTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      name: ['', Validators.required],
      gmail: ['', [Validators.required, Validators.email]],
      photo: [null, Validators.required],
      photoname: [''],
      dob: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.isFileChanged = false;
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.loadUser(+id);
      }
    });
  }

  loadUser(id: number): void {
    this.userService.getUser(id).subscribe((data) => {
      this.userForm.patchValue({
        name: data.name,
        gmail: data.gmail,
        dob: data.dob,
        photoname: data.photo ? data.photo.split('/').pop() : '',
      });
      if (data.photo) {
        this.userForm.get('photo')?.setValue(null);
      }
    });
  }

  onFileChange(event: Event): void {
    this.isFileChanged = true;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (file && this.allowedFileTypes.includes(file.type)) {
      this.userForm.get('photo')?.setValue(file);
      this.userForm.get('photoname')?.setValue(file.name);
      this.photoInvalid = false;
    } else {
      this.photoInvalid = true;
    }
  }

  submitForm(): void {
      const photoName = this.userForm.get('photoname')?.value;
      if (photoName) {
        this.userForm.get('photo')?.clearValidators();
        this.userForm.get('photo')?.updateValueAndValidity();
      }else{
        this.userForm.get('photo')?.setValidators(Validators.required);
        this.userForm.get('photo')?.updateValueAndValidity();
      }
    if (this.userForm.invalid || this.photoInvalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', this.userForm.get('name')?.value);
    formData.append('gmail', this.userForm.get('gmail')?.value);
    formData.append('dob', this.userForm.get('dob')?.value);

    const photoFile = this.userForm.get('photo')?.value;
    if (this.isFileChanged && photoFile) {
      formData.append('photo', photoFile);
      formData.append('photoname', this.userForm.get('photoname')?.value);
    }

    if (this.isEditMode) {
      formData.append('id', this.route.snapshot.paramMap.get('id')!);
      this.userService
        .updateUser(+this.route.snapshot.paramMap.get('id')!, formData)
        .subscribe(() => {
          this.router.navigate(['/']);
        });
    } else {
      this.userService.createUser(formData).subscribe(() => {
        this.router.navigate(['/']);
      });
    }
  }
}
