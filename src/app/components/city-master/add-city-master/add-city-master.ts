import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CityService } from '../../../core/services/city';
import { ActivatedRoute, LoadChildren, Router } from '@angular/router';
import { StateService } from '../../../core/services/state';
import { CityModel} from '../../../ViewModels/City';
import { LoaderService } from '../../../core/services/loader';
import { ToastService } from '../../../shared/toaster/toast-service';

@Component({
  selector: 'app-add-city-master',
  imports: [
    CommonModule,
    FormsModule      
  ],
  templateUrl: './add-city-master.html',
  styleUrl: './add-city-master.scss',
})


export class AddCityMaster {
  stateList: any;
  cityExists: boolean = false;
  cityList:CityModel[]=[];

constructor(
    private cityService: CityService,
    private router: Router,
    private route: ActivatedRoute,
    private stateService:StateService,
    private loader:LoaderService,
    private toaster:ToastService
  ) {}

  //    Form Model (Matches Backend)
  formData: any = {
    cityId: 0,
    cityName: '',
    stateId: null,
    isMetro: true,
    tierLevel: 1,
    abbreviation: '',
    isActive: true
  };

  isEditMode: boolean = false;

  //    State Dropdown
  states: any[] = [];

  ngOnInit() {
    this.checkEditMode();
    this.loadStateList();
      this.loadCityList(); 
  }

  //    Check Edit Mode
  checkEditMode() {
    const id = this.route.snapshot.paramMap.get('id');

    if (id) {
      this.isEditMode = true;
      this.loadCityById(+id);
    }
  }
loadCityList() {
  this.loader.show();
  this.cityService.getAllWithState().subscribe({
    next: (res: any) => {
      this.cityList = res;
      this.loader.hide();
    },
    error: (err) => {
      this.loader.hide();
      this.toaster.show('Error fetching cities',{classname:'bg-warn text-white',delay:5000});
      console.error('Error loading cities:', err);
    }
  });
}
  //    Load City for Edit
  loadCityById(id: number) {
    this.cityService.getById(id).subscribe({
      next: (res: any) => {
        this.formData = {
          cityId: res.cityId,
          cityName: res.cityName,
          stateId: res.stateId,
          isMetro: res.isMetro,
          tierLevel: res.tierLevel,
          abbreviation: res.abbreviation,
          isActive: res.isActive
        };
      },
      error: (err) => {
        console.error('Error loading city:', err);
      }
    });
  }
checkDuplicateCity() {

  if (!this.formData.cityName || !this.formData.stateId) {
    this.cityExists = false;
    return;
  }

  const cityName = this.formData.cityName.trim().toLowerCase();

  this.cityExists = this.cityList.some(c =>
    c.stateId == this.formData.stateId &&  
    c.cityName.trim().toLowerCase() === cityName
  );

  console.log("Exists:", this.cityExists);
}
  //    Submit
  onSubmit(form: any) {
    if (!form.valid) return;
this.loader.show();
    if (this.isEditMode) {
      this.cityService.update(this.formData.cityId, this.formData)
        .subscribe({
          next: () => {
           this.loader.hide();
           this.toaster.show('City updated succesgfully',{classname:'bg-success text-white',delay:5000});
            this.router.navigate(['/city-master']);
          },
          error: (err) => {
            this.loader.hide();
            this.toaster.show('Error updating city!',{classname:'bg-warning text-white',delay:5000});
          }
        });
    } else {
      this.cityService.create(this.formData)
        .subscribe({
          next: () => {
            this.loader.hide();
            this.toaster.show('City created succesfully!',{className:'bg-success text-white',delay :5000});
            this.router.navigate(['/city-master']);
          },
          error: (err) => {
            this.loader.hide();
           this.toaster.show('Error creating city!',{classname:'bg-warning text-white',delay:5000});
          }
        });
    }
  }

  //    Cancel
  onCancel() {
    this.router.navigate(['/city-master']);
  }
  loadStateList() {
  this.stateService.get().subscribe({
    next: (res: any) => {
      this.stateList = res;
    },
    error: (err) => {
     this.toaster.show('Error loading state list!',{classname:'bg-danger text-white',delay:5000});
    }
  });
}
}
