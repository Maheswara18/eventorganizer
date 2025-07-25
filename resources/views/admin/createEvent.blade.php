@extends('layouts.app')

@section('content')
<style>
    body {
        background: url("{{ asset('bg-pattern.png') }}") center center / cover no-repeat !important;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
    }
    .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 2rem;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    .label {
        font-weight: bold;
    }

</style>
<div class="container">
    <h2>Buat Event Baru & Form Pendaftaran</h2>

    @if(session('error'))
        <div class="alert alert-danger">{{ session('error') }}</div>
    @endif

    <form action="{{ route('events.storeWithForm') }}" method="POST">
        @csrf

        {{-- ====== Bagian Event ====== --}}
        <div class="card mb-4">
            <div class="card-header">Informasi Event</div>
            <div class="card-body">
                <div class="form-group">
                    <label for="title">Judul Event</label>
                    <input type="text" name="title" class="form-control" required value="{{ old('title') }}">
                </div>
                <div class="form-group mt-2">
                    <label for="location">Lokasi</label>
                    <input type="text" name="location" class="form-control" required value="{{ old('location') }}">
                </div>
                <div class="form-group mt-2">
                    <label for="date">Tanggal</label>
                    <input type="date" name="date" class="form-control" required value="{{ old('date') }}">
                </div>
            </div>
        </div>

        {{-- ====== Bagian Form Pendaftaran ====== --}}
        <div class="card mb-4">
            <div class="card-header">Form Pendaftaran</div>
            <div class="card-body">
                <div class="form-group">
                    <label for="form[name]">Nama Form</label>
                    <input type="text" name="form[name]" class="form-control" required>
                </div>
                <div class="form-group mt-2">
                    <label for="form[description]">Deskripsi Form</label>
                    <textarea name="form[description]" class="form-control"></textarea>
                </div>

                <hr>

                <h5>Field Form</h5>
                <div id="fields-container"></div>

                <button type="button" class="btn btn-secondary mt-2" onclick="addField()">Tambah Field</button>
            </div>
        </div>

        <button type="submit" class="btn btn-primary">Simpan Event & Form</button>
    </form>
</div>

<script>
let fieldIndex = 0;

function addField() {
    const container = document.getElementById('fields-container');
    const html = `
        <div class="card p-3 mb-2">
            <div class="form-group">
                <label>Label</label>
                <input type="text" name="form[fields][${fieldIndex}][label]" class="form-control" required>
            </div>
            <div class="form-group mt-2">
                <label>Tipe</label>
                <select name="form[fields][${fieldIndex}][type]" class="form-control" onchange="toggleOptions(this, ${fieldIndex})" required>
                    <option value="text">Text</option>
                    <option value="number">Number</option>
                    <option value="email">Email</option>
                    <option value="select">Select</option>
                    <option value="radio">Radio</option>
                    <option value="checkbox">Checkbox</option>
                </select>
            </div>
            <div class="form-group mt-2">
                <label>Options (jika perlu, pisahkan dengan koma)</label>
                <input type="text" name="form[fields][${fieldIndex}][options][]" class="form-control" disabled>
            </div>
            <div class="form-group mt-2">
                <label>Wajib diisi?</label>
                <select name="form[fields][${fieldIndex}][is_required]" class="form-control" required>
                    <option value="1">Ya</option>
                    <option value="0">Tidak</option>
                </select>
            </div>
            <div class="form-group mt-2">
                <label>Urutan</label>
                <input type="number" name="form[fields][${fieldIndex}][order]" class="form-control" value="${fieldIndex}" required>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    fieldIndex++;
}

function toggleOptions(selectEl, index) {
    const optionsInput = selectEl.parentElement.nextElementSibling.querySelector('input');
    const value = selectEl.value;
    if (['select', 'radio', 'checkbox'].includes(value)) {
        optionsInput.disabled = false;
    } else {
        optionsInput.disabled = true;
        optionsInput.value = '';
    }
}
</script>
@endsection
