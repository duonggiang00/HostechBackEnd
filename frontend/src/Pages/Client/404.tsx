import { useNavigate } from "react-router";

const Notfound = () => {
  const navigate = useNavigate();

  return (
    <section className="mt-15">
      <div className="container">
        <div className="row">
          <div className="col-sm-12 ">
            <div className="col-sm-10 col-sm-offset-1  text-center">
              <div
                className="h-100 bg-center bg-no-repeat"
                style={{
                  backgroundImage:
                    "url('https://cdn.dribbble.com/users/285475/screenshots/2083086/dribbble_1.gif')",
                }}
              >
                <h1 className="text-center font-bold text-6xl text-red-500">
                  404
                </h1>
              </div>

              <div className="contant_box_404">
                <h3 className="h2">Không tìm thấy trang phù hợp</h3>

                <p className="mb-5">Vui lòng quay lại!</p>

                <button
                  onClick={() => navigate(-1)}
                  className="p-2 text-white hover:font-bold bg-green-600 drop-shadow drop-shadow-red-600"
                >
                  Quay lại trang trước
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Notfound;
