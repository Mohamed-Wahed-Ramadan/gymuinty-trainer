import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../../core/services/auth.service';
import { TrainerService } from '../../core/services/trainer.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent {
  // Update profile form
  updateProfileData = {
    userName: '',
    email: '',
    fullName: ''
  };
  profileFile: File | null = null;

  // Change password form
  changePasswordData = {
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  // Reset password form
  resetPasswordData = {
    email: '',
    token: '',
    newPassword: '',
    confirmNewPassword: ''
  };

  activePanel: 'list' | 'update' | 'change' | 'reset' | 'delete' = 'list';

  loading = false;

  constructor(private auth: AuthService, private trainerService: TrainerService) {}

  open(panel: typeof this.activePanel) {
    this.activePanel = panel;
  }

  onFileChange(ev: Event) {
    const input = ev.target as HTMLInputElement;
    this.profileFile = input.files && input.files.length ? input.files[0] : null;
  }

  updateProfile() {
    if (!this.updateProfileData.userName || this.updateProfileData.userName.length < 3) {
      alert('Username is required (min 3 chars)');
      return;
    }
    if (!this.updateProfileData.email) { alert('Email is required'); return; }
    if (!this.updateProfileData.fullName || this.updateProfileData.fullName.length < 3) { alert('Full name required'); return; }

    const fd = new FormData();
    fd.append('userName', this.updateProfileData.userName);
    fd.append('email', this.updateProfileData.email);
    fd.append('fullName', this.updateProfileData.fullName);
    if (this.profileFile) fd.append('profilePhoto', this.profileFile, this.profileFile.name);

    this.loading = true;
    this.auth.updateProfile(fd).subscribe({
      next: (res: any) => {
        alert('Profile updated');
        this.loading = false;
        this.activePanel = 'list';
      },
      error: (err: any) => { alert('Update failed: ' + err.message); this.loading = false; }
    });
  }

  changePassword() {
    if (this.changePasswordData.newPassword !== this.changePasswordData.confirmNewPassword) { alert('Passwords do not match'); return; }
    this.loading = true;
    this.auth.changePassword({
      currentPassword: this.changePasswordData.currentPassword,
      newPassword: this.changePasswordData.newPassword,
      confirmNewPassword: this.changePasswordData.confirmNewPassword
    }).subscribe({
      next: (res: any) => { alert('Password changed'); this.loading = false; this.activePanel = 'list'; },
      error: (err: any) => { alert('Change password failed: ' + err.message); this.loading = false; }
    });
  }

  resetPassword() {
    if (this.resetPasswordData.newPassword !== this.resetPasswordData.confirmNewPassword) { alert('Passwords do not match'); return; }
    this.loading = true;
    this.auth.resetPassword({
      email: this.resetPasswordData.email,
      token: this.resetPasswordData.token,
      newPassword: this.resetPasswordData.newPassword,
      confirmNewPassword: this.resetPasswordData.confirmNewPassword
    }).subscribe({
      next: res => { alert('Password reset successful'); this.loading = false; this.activePanel = 'list'; },
      error: err => { alert('Reset failed: ' + err.message); this.loading = false; }
    });
  }

  deleteTrainerProfile() {
    const userId = this.auth.getUserIdFromToken();
    if (!userId) { alert('User ID not found'); return; }
    this.loading = true;
    this.trainerService.getProfileByUserId(userId).subscribe({
      next: profile => {
        const id = profile?.id;
        if (!id) { alert('No trainer profile found'); this.loading = false; return; }
        if (!confirm('Confirm soft-delete of your trainer profile?')) { this.loading = false; return; }
        this.trainerService.deleteProfile(id).subscribe({
          next: () => { alert('Trainer profile deleted'); this.loading = false; this.activePanel = 'list'; },
          error: e => { alert('Delete failed: ' + e.message); this.loading = false; }
        });
      },
      error: err => { alert('Could not fetch trainer profile: ' + err.message); this.loading = false; }
    });
  }
}
