import type { RegisterDentistProps } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from '@inertiajs/react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const phoneRegex = /^(\+63|0)\d{10}$/;

const dentistFormSchema = z.object({
    fname: z
        .string()
        .min(1, 'First name is required')
        .max(255, 'First name must not exceed 255 characters'),
    mname: z
        .string()
        .max(255, 'Middle name must not exceed 255 characters')
        .optional(),
    lname: z
        .string()
        .min(1, 'Last name is required')
        .max(255, 'Last name must not exceed 255 characters'),
    gender: z.enum(['Male', 'Female', 'Other'], {
        message: 'Gender is required',
    }),
    contact_number: z
        .string()
        .optional()
        .refine(
            (val) => {
                if (!val || val.trim() === '') return true;
                const cleaned = val.replace(/[\s-]/g, '');
                return phoneRegex.test(cleaned);
            },
            {
                message:
                    'Phone number must be 11 digits starting with +63 or 0 (e.g., 0917 123 4567)',
            },
        ),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address')
        .max(255, 'Email must not exceed 255 characters'),
    avatar: z
        .instanceof(File)
        .optional()
        .refine(
            (file) => {
                if (!file) return true;
                return file.size <= 2 * 1024 * 1024;
            },
            { message: 'Avatar must be less than 2MB' },
        )
        .refine(
            (file) => {
                if (!file) return true;
                const validTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                ];
                return validTypes.includes(file.type);
            },
            { message: 'Avatar must be JPEG, JPG, PNG, or GIF' },
        ),
    specialization_ids: z.array(z.number()),
    employment_status: z.string(),
    hire_date: z.string().optional(),
});

type DentistFormData = z.infer<typeof dentistFormSchema>;

export default function RegisterDentist({
    specializations = [],
    errors = {},
}: RegisterDentistProps) {
    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors: formErrors },
    } = useForm<DentistFormData>({
        resolver: zodResolver(dentistFormSchema),
        defaultValues: {
            fname: '',
            mname: '',
            lname: '',
            gender: undefined,
            contact_number: '',
            email: '',
            avatar: undefined,
            specialization_ids: [],
            employment_status: 'Active',
            hire_date: '',
        },
    });

    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const selectedSpecializations = watch('specialization_ids');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setValue('avatar', file, { shouldValidate: true });

            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSpecializationChange = (id: number, isChecked: boolean) => {
        const current = selectedSpecializations || [];
        const updated = isChecked
            ? [...current, id]
            : current.filter((specId) => specId !== id);
        setValue('specialization_ids', updated, { shouldValidate: true });
    };

    const onSubmit = (data: DentistFormData) => {
        const submitData = new FormData();
        submitData.append('fname', data.fname);
        submitData.append('mname', data.mname || '');
        submitData.append('lname', data.lname);
        submitData.append('gender', data.gender);
        submitData.append('contact_number', data.contact_number || '');
        submitData.append('email', data.email);
        submitData.append('hire_date', data.hire_date || '');

        if (data.avatar) {
            submitData.append('avatar', data.avatar);
        }

        (data.specialization_ids || []).forEach((id, index) => {
            submitData.append(`specialization_ids[${index}]`, id.toString());
        });

        router.post('/admin/dentists', submitData, {
            preserveScroll: true,
            onSuccess: () => {
                alert(
                    'Dentist registered successfully! An email has been sent with login credentials.',
                );
            },
        });
    };

    return (
        <div>
            <h1>Register New Dentist</h1>
            <p>
                Fill in the details below to register a new dentist. A default
                password will be auto-generated and sent via email.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
                {/* Personal Information Section */}
                <fieldset>
                    <legend>Personal Information</legend>

                    <div>
                        <label htmlFor="fname">
                            First Name <span>*</span>
                        </label>
                        <input type="text" id="fname" {...register('fname')} />
                        {(formErrors.fname || errors.fname) && (
                            <span>
                                {formErrors.fname?.message || errors.fname}
                            </span>
                        )}
                    </div>

                    <div>
                        <label htmlFor="mname">Middle Name</label>
                        <input type="text" id="mname" {...register('mname')} />
                        {(formErrors.mname || errors.mname) && (
                            <span>
                                {formErrors.mname?.message || errors.mname}
                            </span>
                        )}
                    </div>

                    <div>
                        <label htmlFor="lname">
                            Last Name <span>*</span>
                        </label>
                        <input type="text" id="lname" {...register('lname')} />
                        {(formErrors.lname || errors.lname) && (
                            <span>
                                {formErrors.lname?.message || errors.lname}
                            </span>
                        )}
                        <small>
                            Used to generate default password: lastname_XXXX
                        </small>
                    </div>

                    <div>
                        <label htmlFor="gender">
                            Gender <span>*</span>
                        </label>
                        <select id="gender" {...register('gender')}>
                            <option value="">Select Gender</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                        {(formErrors.gender || errors.gender) && (
                            <span>
                                {formErrors.gender?.message || errors.gender}
                            </span>
                        )}
                    </div>
                </fieldset>

                {/* Contact Information Section */}
                <fieldset>
                    <legend>Contact Information</legend>

                    <div>
                        <label htmlFor="email">
                            Email <span>*</span>
                        </label>
                        <input type="email" id="email" {...register('email')} />
                        {(formErrors.email || errors.email) && (
                            <span>
                                {formErrors.email?.message || errors.email}
                            </span>
                        )}
                        <small>
                            Login credentials will be sent to this email
                        </small>
                    </div>

                    <div>
                        <label htmlFor="contact_number">Contact Number</label>
                        <input
                            type="tel"
                            id="contact_number"
                            {...register('contact_number')}
                            placeholder="0917 123 4567 or +63 917 123 4567"
                            maxLength={16}
                        />
                        {(formErrors.contact_number ||
                            errors.contact_number) && (
                            <span style={{ color: 'red' }}>
                                {formErrors.contact_number?.message ||
                                    errors.contact_number}
                            </span>
                        )}
                        <small>
                            Accepts: +63 prefix, 0 prefix, or plain numbers.
                            Will be formatted as: 0111 111 1111
                        </small>
                    </div>
                </fieldset>

                {/* Profile Picture Section */}
                <fieldset>
                    <legend>Profile Picture</legend>

                    <div>
                        <label htmlFor="avatar">Avatar (Optional)</label>
                        <input
                            type="file"
                            id="avatar"
                            name="avatar"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleFileChange}
                        />
                        {(formErrors.avatar || errors.avatar) && (
                            <span>
                                {formErrors.avatar?.message || errors.avatar}
                            </span>
                        )}
                        <small>
                            Max size: 2MB. Accepted formats: JPEG, JPG, PNG, GIF
                        </small>

                        {avatarPreview && (
                            <div>
                                <p>Preview:</p>
                                <img
                                    src={avatarPreview}
                                    alt="Avatar preview"
                                    style={{
                                        width: '150px',
                                        height: '150px',
                                        objectFit: 'cover',
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* Specializations Section */}
                <fieldset>
                    <legend>Specializations (Optional)</legend>

                    {specializations.length > 0 ? (
                        <div>
                            {specializations.map((spec) => (
                                <div key={spec.id}>
                                    <label>
                                        <input
                                            type="checkbox"
                                            value={spec.id}
                                            checked={(
                                                selectedSpecializations || []
                                            ).includes(spec.id)}
                                            onChange={(e) =>
                                                handleSpecializationChange(
                                                    spec.id,
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        {spec.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p>No specializations available</p>
                    )}
                    {(formErrors.specialization_ids ||
                        errors.specialization_ids) && (
                        <span>
                            {formErrors.specialization_ids?.message ||
                                errors.specialization_ids}
                        </span>
                    )}
                </fieldset>

                {/* Employment Information Section */}
                <fieldset>
                    <legend>Employment Information</legend>

                    <div>
                        <label htmlFor="hire_date">Hire Date</label>
                        <input
                            type="date"
                            id="hire_date"
                            {...register('hire_date')}
                        />
                        {(formErrors.hire_date || errors.hire_date) && (
                            <span>
                                {formErrors.hire_date?.message ||
                                    errors.hire_date}
                            </span>
                        )}
                        <small>
                            Employment status will be set to "Active" by default
                        </small>
                    </div>
                </fieldset>

                {/* Password Information */}
                <div
                    style={{
                        backgroundColor: '#f0f8ff',
                        padding: '15px',
                        border: '1px solid #0066cc',
                        borderRadius: '5px',
                        margin: '20px 0',
                    }}
                >
                    <h3>📧 Password Information</h3>
                    <ul>
                        <li>
                            A default password will be automatically generated
                        </li>
                        <li>
                            Format: <code>lastname_XXXX</code> (4 random digits)
                        </li>
                        <li>Credentials will be sent to the dentist's email</li>
                        <li>Dentist must change password on first login</li>
                    </ul>
                </div>

                {/* Submit Button */}
                <div>
                    <button type="submit">Register Dentist</button>
                    <button
                        type="button"
                        onClick={() => router.visit('/admin/dentists')}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}
